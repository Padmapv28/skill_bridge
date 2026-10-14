"""Role-first journey: choose role -> upload resume -> ATS + skill gap + roadmap for that role -> complete -> jobs.

Additive only: no existing route or file is changed. This router stores what the client sends and never
calls the scorer / skill-gap / roadmap generators (those stay in routes/career.py).

New session fields: target_role (title string) and ats_result. Everything else reuses the existing
user_sessions / roadmap_progress / ats_history collections in the same shape the existing routes use.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Body, Depends, HTTPException, Query

from app.database.db import db
from app.models.flow_schemas import FlowAnalysisRequest
from app.services.completion import build_progress_docs, completion_status
from app.utils.current_user import current_user_id
from app.utils.roles import role_title, same_role, session_role

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/flow", tags=["Flow"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _build_state(user_id: str, sess: dict, roadmap_id: Optional[str] = None) -> dict:
    resume = sess.get("resume")
    title = session_role(sess)
    roadmap = sess.get("roadmap") if isinstance(sess.get("roadmap"), dict) else None
    rid = (roadmap_id or sess.get("roadmap_id") or "").strip()

    completion = await completion_status(db, user_id, rid, roadmap) if (roadmap and rid) else None
    if not title:
        stage = "choose_role"
    elif not resume:
        stage = "upload_resume"
    elif not roadmap:
        stage = "analysis"
    elif completion and completion["complete"]:
        stage = "jobs"
    else:
        stage = "roadmap"

    # An ATS score only counts for the resume it was computed from.
    ats = sess.get("ats_result")
    ats_ok = isinstance(ats, dict) and resume and ats.get("resume_uploaded_at") == resume.get("uploaded_at")
    return {
        "success": True,
        "stage": stage,
        "targetRole": title or None,
        "hasResume": bool(resume),
        "resume": {"filename": resume.get("filename"), "uploaded_at": resume.get("uploaded_at")} if resume else None,
        "atsResult": ats.get("result") if ats_ok else None,
        "skillGapResult": sess.get("skill_gap"),
        "roadmapResult": roadmap,
        "roadmapId": sess.get("roadmap_id"),
        "completion": completion,
        "jobsUnlocked": stage == "jobs",
        "updated_at": sess.get("updated_at"),
    }


@router.get("/state")
async def get_state(
    roadmap_id: Optional[str] = Query(None, description="Roadmap id progress is tracked under, if not the saved one"),
    user_id: str = Depends(current_user_id),
):
    sess = await db.user_sessions.find_one({"user_id": user_id}) or {}
    return await _build_state(user_id, sess, roadmap_id)


@router.put("/target-role")
async def set_target_role(payload: Any = Body(...), user_id: str = Depends(current_user_id)):
    """Step 1: pick a role. Works BEFORE any resume is uploaded and survives the upload."""
    title = role_title(payload)
    if not title:
        raise HTTPException(status_code=400, detail="Role title is required")
    if len(title) > 150:
        raise HTTPException(status_code=400, detail="Role title is too long")

    sess = await db.user_sessions.find_one({"user_id": user_id}) or {}
    previous = session_role(sess)
    changed = bool(previous) and not same_role(previous, title)

    fields: dict = {"target_role": title, "updated_at": _now()}
    if changed:
        # New role -> old ATS score, skill gap and roadmap no longer apply (same rule as PATCH /session/role).
        fields.update({"ats_result": None, "skill_gap": None, "roadmap": None, "roadmap_id": None})
    if sess.get("resume"):
        fields["selected_role"] = title  # keep the existing session field in step (it is a plain string)
    await db.user_sessions.update_one(
        {"user_id": user_id}, {"$set": fields, "$setOnInsert": {"user_id": user_id}}, upsert=True
    )
    fresh = await db.user_sessions.find_one({"user_id": user_id}) or {}
    state = await _build_state(user_id, fresh)
    state["changed"] = changed
    return state


@router.post("/analysis")
async def save_analysis(body: FlowAnalysisRequest, user_id: str = Depends(current_user_id)):
    """Step 3: save ATS score + skill gap + roadmap for the target role in one call."""
    sess = await db.user_sessions.find_one({"user_id": user_id}) or {}
    resume = sess.get("resume")
    if not resume:
        raise HTTPException(status_code=409, detail="Upload a resume first")
    title = session_role(sess)
    if not title:
        raise HTTPException(status_code=409, detail="Choose a target role first")
    if not isinstance(body.roadmapResult.get("phases"), list):
        raise HTTPException(status_code=400, detail="Roadmap must be an object containing a 'phases' list")

    now = _now()
    new_rid = str(ObjectId())
    docs = build_progress_docs(user_id, new_rid, body.roadmapResult, now)
    try:
        if docs:
            await db.roadmap_progress.insert_many(docs, ordered=False)
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {"$set": {
                "selected_role": title,
                "ats_result": {"result": body.atsResult, "role": title,
                               "resume_uploaded_at": resume.get("uploaded_at"), "saved_at": now},
                "skill_gap": body.skillGapResult,
                "roadmap": body.roadmapResult,
                "roadmap_id": new_rid,
                "updated_at": now,
            }},
        )
    except Exception:
        logger.exception("Failed to save analysis")
        await db.roadmap_progress.delete_many({"user_id": user_id, "roadmap_id": new_rid})
        raise HTTPException(status_code=500, detail="Could not save your results. Please try again.")

    label = (body.label or f"{title} - {resume.get('filename') or 'resume'}")[:200]
    try:
        await db.ats_history.insert_one({
            "user_id": user_id, "label": label, "role": title,
            "jd_snippet": body.jobDescription[:300], "result": body.atsResult, "created_at": now,
        })
    except Exception:
        logger.exception("Could not write ATS history entry (results were saved)")

    return {"success": True, "stage": "roadmap", "role": title, "roadmapId": new_rid, "totalSkills": len(docs)}

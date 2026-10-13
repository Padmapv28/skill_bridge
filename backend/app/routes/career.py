"""Authenticated career analysis endpoints and public JSON ATS endpoint."""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import logging
import traceback

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.database.db import db
from app.services.role_predictor import predict_roles
from app.services.skill_gap_analyzer import analyze_skill_gap
from app.services.roadmap_generator import generate_roadmap
from app.services.course_matcher import recommend_courses
from app.services.ats_scorer import score_ats
from app.services.role_search import search_roles as search_roles_service
from app.utils.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)
@router.post("/search-roles")
async def search_roles_api(request: Dict[str, Any]):
    """Public role search used by the landing page."""
    query = str(
        request.get("query")
        or request.get("searchQuery")
        or request.get("search_query")
        or request.get("q")
        or ""
    ).strip()

    if not query:
        return {"roles": []}

    try:
        roles = await run_in_threadpool(
            search_roles_service,
            query,
        )
        return {"roles": roles}
    except Exception as exc:
        logger.exception("Live role search failed")
        raise HTTPException(
            status_code=500,
            detail="Unable to search career roles right now.",
        ) from exc


class ResumePredictionRequest(BaseModel):
    resume: Dict[str, Any] = Field(default_factory=dict)
    targetRole: Optional[str] = None
    target_role: Optional[str] = None


def _role_name(role: Any) -> str:
    if isinstance(role, dict):
        role = role.get("title") or role.get("role") or role.get("name")
    return str(role or "").strip()


async def _current_resume(user_id: str, supplied: Optional[dict] = None) -> dict:
    """Prefer the authenticated user's server-side uploaded resume."""
    session = await db.user_sessions.find_one({"user_id": user_id})
    saved = (session or {}).get("resume") or {}
    parsed = saved.get("parsed_data") or saved.get("parsedData")
    if isinstance(parsed, dict) and parsed:
        return parsed
    # The authenticated main pipeline must use the resume uploaded to this
    # account's server-side session. Do not accept stale browser state here.
    raise HTTPException(
        status_code=409,
        detail="No resume is available for this account. Upload a resume first.",
    )


async def _save_session_fields(user_id: str, fields: dict) -> None:
    fields = {**fields, "updated_at": datetime.now(timezone.utc), "user_id": user_id}
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": fields},
        upsert=True,
    )


@router.post("/predict-roles")
async def predict_roles_api(
    request: ResumePredictionRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    resume = await _current_resume(user_id, request.resume)
    target_role = (request.targetRole or request.target_role or "").strip() or None
    try:
        logger.info("Predicting roles for authenticated user %s", user_id)
        result = await run_in_threadpool(predict_roles, resume, target_role)
        await _save_session_fields(user_id, {
            "predictions": result,
            "target_role": target_role,
            "selected_role": None,
            "skill_gap": None,
            "roadmap": None,
            "roadmap_id": None,
        })
        if target_role:
            result["target_role"] = target_role
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Role prediction failed")
        raise HTTPException(status_code=500, detail=f"Role prediction failed: {exc}") from exc


@router.post("/skill-gap")
async def skill_gap_api(
    request: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    role = request.get("role")
    if not _role_name(role):
        raise HTTPException(status_code=400, detail="Role is required.")
    resume = await _current_resume(user_id, request.get("resume"))
    try:
        result = await run_in_threadpool(analyze_skill_gap, role, resume)
        await _save_session_fields(user_id, {
            "selected_role": _role_name(role),
            "skill_gap": result,
            "roadmap": None,
            "roadmap_id": None,
        })
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Skill-gap analysis failed")
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {exc}") from exc


@router.post("/roadmap")
async def roadmap_api(
    request: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    role = request.get("role")
    if not _role_name(role):
        raise HTTPException(status_code=400, detail="Role is required.")
    resume = await _current_resume(user_id, request.get("resume"))
    missing_skills = request.get("missingSkills", [])
    partial_skills = request.get("partialSkills", [])

    try:
        result = await run_in_threadpool(
            generate_roadmap,
            role,
            resume,
            missing_skills,
            partial_skills,
        )

        roadmap_id = str(ObjectId())
        now = datetime.now(timezone.utc)
        progress_docs = []
        for phase_index, phase in enumerate(result.get("phases", []), start=1):
            phase_number = phase.get("phase", phase.get("phase_number", phase_index))
            try:
                phase_number = int(phase_number)
            except (TypeError, ValueError):
                phase_number = phase_index
            for skill in phase.get("skills", []) or []:
                skill_name = skill.get("name") if isinstance(skill, dict) else skill
                skill_name = str(skill_name or "").strip()
                if skill_name:
                    progress_docs.append({
                        "user_id": user_id,
                        "roadmap_id": roadmap_id,
                        "phase_number": phase_number,
                        "skill_name": skill_name,
                        "status": "not_started",
                        "completed_at": None,
                        "updated_at": now,
                    })

        if progress_docs:
            await db.roadmap_progress.insert_many(progress_docs, ordered=False)

        result["roadmap_id"] = roadmap_id
        await _save_session_fields(user_id, {
            "selected_role": _role_name(role),
            "roadmap": result,
            "roadmap_id": roadmap_id,
        })
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Roadmap generation failed")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {exc}") from exc


@router.post("/course-suggestions")
async def course_suggestions_api(
    request: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    role_name = _role_name(request.get("role"))
    if not role_name:
        raise HTTPException(status_code=400, detail="Role is required.")

    def extract_names(items):
        names, seen = [], set()
        for item in items or []:
            name = item.get("name") if isinstance(item, dict) else item
            name = str(name or "").strip()
            key = name.casefold()
            if name and key not in seen:
                seen.add(key)
                names.append(name)
        return names

    missing = extract_names(request.get("missingSkills", []))
    partial = extract_names(request.get("partialSkills", []))
    skills = list(dict.fromkeys(missing + partial))[:4]
    if not skills:
        return {"role": role_name, "missing_skills": [], "partial_skills": [], "course_suggestions": {}}

    try:
        course_map = await run_in_threadpool(recommend_courses, skills)
        return {
            "role": role_name,
            "missing_skills": missing,
            "partial_skills": partial,
            "course_suggestions": course_map,
        }
    except Exception as exc:
        logger.exception("Course recommendations failed")
        raise HTTPException(status_code=500, detail=f"Course suggestion generation failed: {exc}") from exc


@router.post("/ats-score")
async def ats_score_api(request: Dict[str, Any]):
    """ATS score from already-parsed resume JSON and raw job-description text."""
    resume = request.get("resume") or request.get("resumeData") or request.get("resume_data")
    jd_text = request.get("jdText") or request.get("jd_text") or ""
    if not resume:
        raise HTTPException(status_code=400, detail="Resume data is required.")
    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is required.")
    try:
        return await run_in_threadpool(score_ats, resume, jd_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("ATS scoring failed")
        raise HTTPException(status_code=500, detail=f"ATS scoring failed: {exc}") from exc

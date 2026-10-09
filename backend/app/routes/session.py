"""
session.py

Session persistence routes for SkillBridge.
Allows user flow to persist across reloads and clears downstream stages
when earlier inputs change.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.database.db import db
from app.models.schemas import (
    SessionPredictionsUpdate,
    SessionRoleUpdate,
    SessionSkillGapUpdate,
    SessionRoadmapUpdate,
    SessionResponse,
)
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


async def _get_existing_session_or_conflict(user_id: str) -> dict[str, Any]:
    session = await db.user_sessions.find_one({"user_id": user_id})
    if not session or not session.get("resume"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No resume uploaded in current session. Please upload a resume first.",
        )
    return session


@router.get(
    "/current",
    response_model=SessionResponse,
    summary="Get current user session state",
)
async def get_current_session(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    session = await db.user_sessions.find_one({"user_id": user_id})

    if not session:
        return SessionResponse(
            user_id=user_id,
            resume=None,
            predictions=None,
            selected_role=None,
            skill_gap=None,
            roadmap=None,
            roadmap_id=None,
            updated_at=None,
        )

    return SessionResponse(
        user_id=user_id,
        resume=session.get("resume"),
        predictions=session.get("predictions"),
        selected_role=session.get("selected_role"),
        skill_gap=session.get("skill_gap"),
        roadmap=session.get("roadmap"),
        roadmap_id=session.get("roadmap_id"),
        updated_at=session.get("updated_at"),
    )


@router.patch(
    "/predictions",
    summary="Persist role predictions for the current session",
)
async def update_predictions(
    body: SessionPredictionsUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    await _get_existing_session_or_conflict(user_id)

    now = datetime.now(timezone.utc)
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {"predictions": body.predictions, "updated_at": now}},
    )

    return {"success": True, "predictions": body.predictions, "updated_at": now}


@router.patch(
    "/role",
    summary="Persist selected role (resets skill gap, roadmap and roadmap_id)",
)
async def update_role(
    body: SessionRoleUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    await _get_existing_session_or_conflict(user_id)

    chosen_role = body.selected_role or body.role
    if not chosen_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name is required.",
        )

    now = datetime.now(timezone.utc)
    # Changing the role must clear skill_gap and roadmap
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "selected_role": chosen_role,
                "skill_gap": None,
                "roadmap": None,
                "roadmap_id": None,
                "updated_at": now,
            }
        },
    )

    return {"success": True, "selected_role": chosen_role, "updated_at": now}


@router.patch(
    "/skill-gap",
    summary="Persist skill gap analysis (resets roadmap and roadmap_id)",
)
async def update_skill_gap(
    body: SessionSkillGapUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    await _get_existing_session_or_conflict(user_id)

    now = datetime.now(timezone.utc)
    # Saving skill_gap clears roadmap
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "skill_gap": body.skill_gap,
                "roadmap": None,
                "roadmap_id": None,
                "updated_at": now,
            }
        },
    )

    return {"success": True, "skill_gap": body.skill_gap, "updated_at": now}


@router.patch(
    "/roadmap",
    summary="Persist generated roadmap, assign roadmap_id and initialize progress documents",
)
async def update_roadmap(
    body: SessionRoadmapUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    await _get_existing_session_or_conflict(user_id)

    now = datetime.now(timezone.utc)
    roadmap_id = str(ObjectId())

    # Initialize progress documents from roadmap.phases[].skills[]
    phases = body.roadmap.get("phases", [])
    progress_docs = []

    for idx, phase in enumerate(phases, start=1):
        phase_num = phase.get("phase")
        if phase_num is None:
            phase_num = phase.get("phase_number", idx)
        try:
            phase_num = int(phase_num)
        except (ValueError, TypeError):
            phase_num = idx

        skills = phase.get("skills", [])
        for skill in skills:
            skill_name = str(skill).strip()
            if skill_name:
                progress_docs.append({
                    "user_id": user_id,
                    "roadmap_id": roadmap_id,
                    "phase_number": phase_num,
                    "skill_name": skill_name,
                    "status": "not_started",
                    "completed_at": None,
                    "updated_at": now,
                })

    if progress_docs:
        # Use unordered insert or individual upserts to safely handle possible duplicates
        try:
            await db.roadmap_progress.insert_many(progress_docs, ordered=False)
        except Exception as e:
            logger.warning(f"Note during roadmap progress seed insert: {e}")

    await db.user_sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "roadmap": body.roadmap,
                "roadmap_id": roadmap_id,
                "updated_at": now,
            }
        },
    )

    return {
        "success": True,
        "roadmap_id": roadmap_id,
        "roadmap": body.roadmap,
        "updated_at": now,
    }


@router.delete(
    "/current",
    summary="Clear current session for 'start over'",
)
async def delete_current_session(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    await db.user_sessions.delete_one({"user_id": user_id})
    return {"success": True, "message": "Session cleared."}

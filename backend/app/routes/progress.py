"""
progress.py

Roadmap skill progress tracking endpoints.
Allows users to track learning progress on skills across phases in their roadmap.
"""

from collections import defaultdict
from datetime import datetime, timezone
import logging
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends

from app.database.db import db
from app.models.schemas import (
    ProgressSkillUpdate,
    ProgressStatusEnum,
    ProgressSummaryResponse,
    PhaseSummary,
)
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


async def _verify_roadmap_access(roadmap_id: str, user_id: str) -> list[dict[str, Any]]:
    """
    Validate roadmap_id format and user ownership.
    Returns list of progress documents for that roadmap.
    Raises HTTPException(400) if id format is invalid.
    Raises HTTPException(404) if no progress found.
    Raises HTTPException(403) if owned by another user.
    """
    if not ObjectId.is_valid(roadmap_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid roadmap ID format.",
        )

    cursor = db.roadmap_progress.find({"roadmap_id": roadmap_id})
    docs = [d async for d in cursor]

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap progress not found.",
        )

    if docs[0]["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this roadmap.",
        )

    return docs


@router.get(
    "/{roadmap_id}",
    summary="Get full roadmap progress grouped by phase",
)
async def get_roadmap_progress(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    docs = await _verify_roadmap_access(roadmap_id, user_id)

    # Group skills by phase_number
    phases_map = defaultdict(list)
    for doc in docs:
        phases_map[doc["phase_number"]].append({
            "skill_name": doc["skill_name"],
            "status": doc["status"],
            "completed_at": doc.get("completed_at"),
            "updated_at": doc.get("updated_at"),
        })

    phases_output = []
    for phase_num in sorted(phases_map.keys()):
        phases_output.append({
            "phase_number": phase_num,
            "skills": phases_map[phase_num],
        })

    return {
        "roadmap_id": roadmap_id,
        "phases": phases_output,
    }


@router.patch(
    "/{roadmap_id}/skill",
    summary="Update progress status of a specific skill in a roadmap",
)
async def update_skill_progress(
    roadmap_id: str,
    body: ProgressSkillUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    await _verify_roadmap_access(roadmap_id, user_id)

    skill_doc = await db.roadmap_progress.find_one({
        "roadmap_id": roadmap_id,
        "phase_number": body.phase_number,
        "skill_name": body.skill_name,
    })

    if not skill_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill '{body.skill_name}' not found in phase {body.phase_number} of this roadmap.",
        )

    now = datetime.now(timezone.utc)
    completed_at = now if body.status == ProgressStatusEnum.completed else None

    await db.roadmap_progress.update_one(
        {"_id": skill_doc["_id"]},
        {
            "$set": {
                "status": body.status.value,
                "completed_at": completed_at,
                "updated_at": now,
            }
        },
    )

    updated = await db.roadmap_progress.find_one({"_id": skill_doc["_id"]})
    return {
        "roadmap_id": roadmap_id,
        "phase_number": updated["phase_number"],
        "skill_name": updated["skill_name"],
        "status": updated["status"],
        "completed_at": updated["completed_at"],
        "updated_at": updated["updated_at"],
    }


@router.get(
    "/{roadmap_id}/summary",
    response_model=ProgressSummaryResponse,
    summary="Get overall and per-phase progress summary statistics",
)
async def get_progress_summary(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    docs = await _verify_roadmap_access(roadmap_id, user_id)

    total = len(docs)
    completed = sum(1 for d in docs if d.get("status") == "completed")
    in_progress = sum(1 for d in docs if d.get("status") == "in_progress")
    not_started = sum(1 for d in docs if d.get("status") == "not_started")

    overall_percent = round((completed / total) * 100) if total > 0 else 0

    # Per-phase breakdown
    phases_map = defaultdict(list)
    for doc in docs:
        phases_map[doc["phase_number"]].append(doc)

    per_phase = []
    for phase_num in sorted(phases_map.keys()):
        p_docs = phases_map[phase_num]
        p_total = len(p_docs)
        p_completed = sum(1 for d in p_docs if d.get("status") == "completed")
        p_percent = round((p_completed / p_total) * 100) if p_total > 0 else 0
        per_phase.append(PhaseSummary(phase_number=phase_num, percent=p_percent))

    return ProgressSummaryResponse(
        overall_percent=overall_percent,
        total=total,
        completed=completed,
        in_progress=in_progress,
        not_started=not_started,
        per_phase=per_phase,
    )

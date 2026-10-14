"""Final step of the journey: direct job openings for the target role, unlocked once the roadmap is complete."""
import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.database.db import db
from app.services.completion import completion_status
from app.services.jobs import build_search_links, find_jobs
from app.utils.current_user import current_user_id
from app.utils.env import setting
from app.utils.roles import session_role

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])

_SLUG_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,100}$")


@router.get("/recommendations")
async def job_recommendations(
    roadmap_id: Optional[str] = Query(None, description="Roadmap id the frontend marks progress under (defaults to the saved one)"),
    location: str = Query("", max_length=100),
    country: Optional[str] = Query(None, pattern=r"^[A-Za-z]{2}$"),
    page: int = Query(1, ge=1, le=20),
    limit: int = Query(10, ge=1, le=30),
    user_id: str = Depends(current_user_id),
):
    sess = await db.user_sessions.find_one({"user_id": user_id}) or {}
    roadmap = sess.get("roadmap")
    if not isinstance(roadmap, dict) or not isinstance(roadmap.get("phases"), list):
        raise HTTPException(status_code=409, detail="Generate your roadmap first")

    title = session_role(sess)
    if not title:
        raise HTTPException(status_code=409, detail="Choose a target role first")

    rid = (roadmap_id or sess.get("roadmap_id") or "").strip()
    if not _SLUG_RE.match(rid):
        raise HTTPException(status_code=400, detail="Invalid roadmap_id")

    completion = await completion_status(db, user_id, rid, roadmap)
    if not completion["complete"]:
        raise HTTPException(
            status_code=409,
            detail=f"Complete your roadmap to unlock job openings ({completion['completed']} of {completion['total']} skills done).",
        )

    country = (country or setting("JOBS_COUNTRY", "in")).lower()
    location = location.strip() or setting("JOBS_DEFAULT_LOCATION", "")
    result = await find_jobs(db, title, location, country, page, limit)
    return {
        "success": True,
        "unlocked": True,
        "role": title,
        "location": location,
        "country": country,
        "page": page,
        "completion": completion,
        "source": result["source"],
        "total": result["total"],
        "jobs": result["jobs"],
        "searchLinks": build_search_links(title, location, country),
        "note": result["note"],
        "attribution": {"text": "Jobs by Adzuna", "url": "https://www.adzuna.com"} if result["source"] == "adzuna" else None,
    }

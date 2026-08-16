"""Career roadmap routes."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database.mongodb import get_db
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse
from app.services import roadmap_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/roadmaps", tags=["Roadmaps"])


def _require_db(db: Database) -> Database:
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return db


@router.post(
    "",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a career learning roadmap (rule-based)",
)
def create_roadmap(
    payload: RoadmapGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return roadmap_service.generate_roadmap(
        db, current_user["id"], payload.role, payload.resume_id, payload.missing_skills
    )


@router.get("", response_model=List[RoadmapResponse], summary="List the current user's roadmaps")
def list_roadmaps(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    db = _require_db(db)
    return roadmap_service.list_roadmaps(db, current_user["id"])


@router.get("/{roadmap_id}", response_model=RoadmapResponse, summary="Get a single roadmap")
def get_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return roadmap_service.get_roadmap(db, current_user["id"], roadmap_id)


@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a roadmap")
def delete_roadmap(
    roadmap_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    roadmap_service.delete_roadmap(db, current_user["id"], roadmap_id)
    return None

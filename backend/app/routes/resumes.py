"""
Resume routes: CRUD operations (under /api/resumes) and the standalone
resume analysis endpoint (/api/analyze-resume).
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database.mongodb import get_db
from app.schemas.resume import (
    ResumeAnalysisResponse,
    ResumeAnalyzeRequest,
    ResumeCreateRequest,
    ResumeResponse,
    ResumeUpdateRequest,
)
from app.services import prediction_service, resume_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

# Separate router (no prefix) for /api/analyze-resume, which lives outside
# the /api/resumes/* namespace per the API spec.
analyze_router = APIRouter(tags=["Resumes"])


def _require_db(db: Database) -> Database:
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return db


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED, summary="Create a resume")
def create_resume(
    payload: ResumeCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return resume_service.create_resume(db, current_user["id"], payload.model_dump())


@router.get("", response_model=List[ResumeResponse], summary="List the current user's resumes")
def list_resumes(current_user: dict = Depends(get_current_user), db: Database = Depends(get_db)):
    db = _require_db(db)
    return resume_service.list_resumes(db, current_user["id"])


@router.get("/{resume_id}", response_model=ResumeResponse, summary="Get a single resume")
def get_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return resume_service.get_resume(db, current_user["id"], resume_id)


@router.put("/{resume_id}", response_model=ResumeResponse, summary="Update a resume")
def update_resume(
    resume_id: str,
    payload: ResumeUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    return resume_service.update_resume(db, current_user["id"], resume_id, payload.model_dump(exclude_unset=True))


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a resume")
def delete_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)
    resume_service.delete_resume(db, current_user["id"], resume_id)
    return None


@analyze_router.post(
    "/api/analyze-resume",
    response_model=ResumeAnalysisResponse,
    summary="Analyze resume data (rule-based normalization)",
)
def analyze_resume(
    payload: ResumeAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    db = _require_db(db)

    skills = payload.skills
    education = payload.education
    projects = payload.projects
    experience = payload.experience
    certifications = payload.certifications

    if payload.resume_id:
        resume = resume_service.get_resume(db, current_user["id"], payload.resume_id)
        skills = skills or resume.get("skills")
        education = education or resume.get("education")
        projects = projects or resume.get("projects")
        experience = experience or resume.get("experience")
        certifications = certifications or resume.get("certifications")

    def _dump(items):
        return [i.model_dump() if hasattr(i, "model_dump") else i for i in (items or [])]

    return prediction_service.analyze_profile(
        skills=skills,
        education=_dump(education),
        projects=_dump(projects),
        experience=_dump(experience),
        certifications=certifications,
    )

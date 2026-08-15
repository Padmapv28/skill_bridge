"""
Career role prediction and resume analysis business logic.

IMPORTANT: This module implements a deterministic, rule-based prediction
system using a configurable role -> required-skills mapping. It does NOT
use or claim to use any AI/ML model. The public function signatures
(predict_roles, calculate_skill_gap, analyze_profile) are intentionally
kept simple and self-contained so a real ML/LLM-backed implementation can
be swapped in later without any changes to the routes that call them.
"""
from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

from app.utils.helpers import is_valid_object_id, serialize_doc, to_object_id

from app.services.ml.role_predictor import predict_roles as llm_predict_roles
from app.services.ml.skill_gap_analyzer import analyze_skill_gap
import json
from pathlib import Path

# Configurable role -> required skills mapping. Edit this dictionary to
# add roles or adjust required skills without touching any other code.
ROLE_SKILL_MAP: Dict[str, List[str]] = {
    "Data Analyst": ["Python", "SQL", "Pandas", "Power BI", "Excel", "Statistics"],
    "Backend Developer": ["Python", "FastAPI", "SQL", "Docker", "Git", "REST APIs"],
    "Frontend Developer": ["JavaScript", "React", "HTML", "CSS", "Git"],
    "Data Scientist": ["Python", "Pandas", "NumPy", "Machine Learning", "Statistics", "SQL"],
    "Machine Learning Engineer": ["Python", "Machine Learning", "TensorFlow", "SQL", "Docker", "Statistics"],
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "Git", "REST APIs"],
    "DevOps Engineer": ["Docker", "Kubernetes", "Linux", "CI/CD", "Git", "Cloud"],
    "Business Analyst": ["Excel", "SQL", "Power BI", "Communication", "Statistics"],
}


def normalize_skills(skills: List[str]) -> List[str]:
    """Trim, de-duplicate (case-insensitively) and preserve original casing."""
    seen = set()
    normalized = []
    for skill in skills or []:
        cleaned = (skill or "").strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key not in seen:
            seen.add(key)
            normalized.append(cleaned)
    return normalized


def analyze_profile(
    skills: Optional[List[str]] = None,
    education: Optional[List[dict]] = None,
    projects: Optional[List[dict]] = None,
    experience: Optional[List[dict]] = None,
    certifications: Optional[List[str]] = None,
) -> dict:
    """
    Normalize resume data into a clean, structured shape.

    This is a rule-based normalization step (trimming/de-duplicating
    skills and certifications), not an AI/ML analysis. Kept as its own
    service function so a real AI/LLM-backed analyzer can replace the
    internals later without changing the calling route.
    """
    return {
        "skills": normalize_skills(skills or []),
        "education": education or [],
        "experience": experience or [],
        "projects": projects or [],
        "certifications": normalize_skills(certifications or []),
    }


def _resolve_skills(
    db: Database, user_id: str, resume_id: Optional[str], skills: Optional[List[str]]
) -> List[str]:
    if skills:
        return normalize_skills(skills)
    if resume_id:
        if not is_valid_object_id(resume_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        resume = db.resumes.find_one({"_id": to_object_id(resume_id)})
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        if str(resume["user_id"]) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this resume")
        return normalize_skills(resume.get("skills", []))
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either 'skills' or 'resume_id'")


def predict_roles(
    db: Database, user_id: str, resume_id: Optional[str], skills: Optional[List[str]]
) -> dict:
    """Use Ollama + Llama 3.2 to predict the top 5 career roles."""

    user_skills = _resolve_skills(db, user_id, resume_id, skills)

    resume_json = {
        "skills": user_skills,
        "education": [],
        "experience": [],
        "projects": [],
    }

    prediction = llm_predict_roles(resume_json)

    doc = {
        "user_id": ObjectId(user_id),
        "resume_id": resume_id,
        "predictions": prediction["predictions"],
    }

    result = db.predictions.insert_one(doc)
    saved = db.predictions.find_one({"_id": result.inserted_id})
    return serialize_doc(saved)


def calculate_skill_gap(
    db: Database, user_id: str, role: str, resume_id: Optional[str], skills: Optional[List[str]]
) -> dict:
    """Use sentence-transformers semantic matching for skill-gap analysis."""

    user_skills = _resolve_skills(db, user_id, resume_id, skills)

    dataset_path = Path(__file__).parent / "ml" / "data" / "role_skills_mapping.json"

    with open(dataset_path, "r", encoding="utf-8") as f:
        role_map = json.load(f)

    if role not in role_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown role '{role}'",
        )

    result = analyze_skill_gap(user_skills, role_map[role])

    return {
        "role": role,
        "current_skills": user_skills,
        "required_skills": role_map[role],
        "matching_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "skill_gap_percentage": round(100 - result["match_percentage"], 2),
    }


def list_predictions(db: Database, user_id: str) -> List[dict]:
    docs = db.predictions.find({"user_id": ObjectId(user_id)})
    return [serialize_doc(d) for d in docs]


def get_prediction(db: Database, user_id: str, prediction_id: str) -> dict:
    if not is_valid_object_id(prediction_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    doc = db.predictions.find_one({"_id": to_object_id(prediction_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")
    if str(doc["user_id"]) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this prediction")
    return serialize_doc(doc)

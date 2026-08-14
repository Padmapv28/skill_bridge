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
    """Score every configured role against the user's skills and persist the result."""
    user_skills = _resolve_skills(db, user_id, resume_id, skills)
    user_skills_lower = {s.lower() for s in user_skills}

    scored_roles = []
    for role, required_skills in ROLE_SKILL_MAP.items():
        matching = [s for s in required_skills if s.lower() in user_skills_lower]
        missing = [s for s in required_skills if s.lower() not in user_skills_lower]
        score = round(len(matching) / len(required_skills), 2) if required_skills else 0.0
        scored_roles.append(
            {"role": role, "score": score, "matching_skills": matching, "missing_skills": missing}
        )

    scored_roles.sort(key=lambda r: r["score"], reverse=True)
    top_predictions = scored_roles[:5]

    doc = {
        "user_id": ObjectId(user_id),
        "resume_id": resume_id,
        "predictions": top_predictions,
    }
    result = db.predictions.insert_one(doc)
    saved = db.predictions.find_one({"_id": result.inserted_id})
    return serialize_doc(saved)


def calculate_skill_gap(
    db: Database, user_id: str, role: str, resume_id: Optional[str], skills: Optional[List[str]]
) -> dict:
    """Compute matching/missing skills and gap percentage for a specific role."""
    if role not in ROLE_SKILL_MAP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown role '{role}'")

    user_skills = _resolve_skills(db, user_id, resume_id, skills)
    user_skills_lower = {s.lower() for s in user_skills}
    required_skills = ROLE_SKILL_MAP[role]

    matching = [s for s in required_skills if s.lower() in user_skills_lower]
    missing = [s for s in required_skills if s.lower() not in user_skills_lower]
    gap_percentage = round((len(missing) / len(required_skills)) * 100, 2) if required_skills else 0.0

    return {
        "role": role,
        "current_skills": user_skills,
        "required_skills": required_skills,
        "matching_skills": matching,
        "missing_skills": missing,
        "skill_gap_percentage": gap_percentage,
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

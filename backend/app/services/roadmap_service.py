"""
Career roadmap generation business logic.

Like the prediction service, this uses a deterministic, configurable
skill -> topic grouping to build a phased learning roadmap. No AI/ML
model is used or implied; the structure keeps room for a real
LLM-generated roadmap to be swapped in later.
"""
from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

from app.services.prediction_service import ROLE_SKILL_MAP, normalize_skills
from app.utils.helpers import is_valid_object_id, serialize_doc, to_object_id

# Configurable grouping of individual skills into learning phases/topics.
# Skills not listed here fall back into a generic "Additional Skills" phase.
SKILL_TOPIC_MAP: Dict[str, str] = {
    "Python": "Programming Foundations",
    "Pandas": "Programming Foundations",
    "NumPy": "Programming Foundations",
    "SQL": "Databases & SQL",
    "Power BI": "Data Visualization",
    "Excel": "Data Visualization",
    "Statistics": "Data Visualization",
    "FastAPI": "Backend Development",
    "REST APIs": "Backend Development",
    "Docker": "DevOps & Deployment",
    "Kubernetes": "DevOps & Deployment",
    "CI/CD": "DevOps & Deployment",
    "Cloud": "DevOps & Deployment",
    "Linux": "DevOps & Deployment",
    "Git": "Version Control & Collaboration",
    "JavaScript": "Frontend Development",
    "React": "Frontend Development",
    "HTML": "Frontend Development",
    "CSS": "Frontend Development",
    "Node.js": "Full Stack Development",
    "Machine Learning": "Machine Learning",
    "TensorFlow": "Machine Learning",
    "Communication": "Soft Skills",
}

DEFAULT_PHASE_DURATION_WEEKS = 2


def _resolve_missing_skills(
    db: Database, user_id: str, role: str, resume_id: Optional[str], missing_skills: Optional[List[str]]
) -> List[str]:
    if missing_skills:
        return normalize_skills(missing_skills)

    if role not in ROLE_SKILL_MAP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown role '{role}'")

    required_skills = ROLE_SKILL_MAP[role]
    user_skills: List[str] = []

    if resume_id:
        if not is_valid_object_id(resume_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        resume = db.resumes.find_one({"_id": to_object_id(resume_id)})
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        if str(resume["user_id"]) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this resume")
        user_skills = normalize_skills(resume.get("skills", []))

    user_skills_lower = {s.lower() for s in user_skills}
    return [s for s in required_skills if s.lower() not in user_skills_lower]


def _build_phases(missing_skills: List[str]) -> List[dict]:
    topic_order: List[str] = []
    topic_skills: Dict[str, List[str]] = {}

    for skill in missing_skills:
        topic = SKILL_TOPIC_MAP.get(skill, "Additional Skills")
        if topic not in topic_skills:
            topic_skills[topic] = []
            topic_order.append(topic)
        topic_skills[topic].append(skill)

    phases = []
    for idx, topic in enumerate(topic_order, start=1):
        skills = topic_skills[topic]
        duration = max(DEFAULT_PHASE_DURATION_WEEKS, len(skills))
        phases.append({"phase": idx, "title": topic, "skills": skills, "duration_weeks": duration})
    return phases


def generate_roadmap(
    db: Database, user_id: str, role: str, resume_id: Optional[str], missing_skills: Optional[List[str]]
) -> dict:
    resolved_missing = _resolve_missing_skills(db, user_id, role, resume_id, missing_skills)
    phases = _build_phases(resolved_missing)

    doc = {"user_id": ObjectId(user_id), "role": role, "roadmap": phases}
    result = db.roadmaps.insert_one(doc)
    saved = db.roadmaps.find_one({"_id": result.inserted_id})
    return serialize_doc(saved)


def list_roadmaps(db: Database, user_id: str) -> List[dict]:
    docs = db.roadmaps.find({"user_id": ObjectId(user_id)})
    return [serialize_doc(d) for d in docs]


def get_roadmap(db: Database, user_id: str, roadmap_id: str) -> dict:
    if not is_valid_object_id(roadmap_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    doc = db.roadmaps.find_one({"_id": to_object_id(roadmap_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    if str(doc["user_id"]) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this roadmap")
    return serialize_doc(doc)


def delete_roadmap(db: Database, user_id: str, roadmap_id: str) -> None:
    get_roadmap(db, user_id, roadmap_id)  # raises 404/403 if not found or not owned
    db.roadmaps.delete_one({"_id": to_object_id(roadmap_id)})

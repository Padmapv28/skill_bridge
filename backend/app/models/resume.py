"""Represents the shape of a `resumes` document stored in MongoDB."""
from datetime import datetime, timezone
from typing import Dict, List, Optional


class ResumeModel:
    def __init__(
        self,
        user_id,
        name: str,
        email: str,
        education: Optional[List[Dict]] = None,
        skills: Optional[List[str]] = None,
        projects: Optional[List[Dict]] = None,
        experience: Optional[List[Dict]] = None,
        certifications: Optional[List[str]] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.education = education or []
        self.skills = skills or []
        self.projects = projects or []
        self.experience = experience or []
        self.certifications = certifications or []
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "email": self.email,
            "education": self.education,
            "skills": self.skills,
            "projects": self.projects,
            "experience": self.experience,
            "certifications": self.certifications,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

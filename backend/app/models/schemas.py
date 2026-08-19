"""
schemas.py

Pydantic models representing the MongoDB collections used across the app.
"""

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field


def _now() -> datetime:
    return datetime.utcnow()


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: Optional[str] = Field(default=None, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=_now)

    class Config:
        populate_by_name = True


class UserPublic(UserBase):
    id: str
    created_at: datetime


class ResumeCreate(BaseModel):
    user_id: str
    uploaded_file_name: str
    parsed_data: dict[str, Any]


class ResumeInDB(ResumeCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    uploaded_at: datetime = Field(default_factory=_now)

    class Config:
        populate_by_name = True


class PredictionCreate(BaseModel):
    resume_id: str
    predicted_roles: list[dict[str, Any]]


class PredictionInDB(PredictionCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=_now)

    class Config:
        populate_by_name = True


class RoadmapCreate(BaseModel):
    resume_id: str
    target_role: str
    roadmap_steps: list[dict[str, Any]]


class RoadmapInDB(RoadmapCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=_now)

    class Config:
        populate_by_name = True

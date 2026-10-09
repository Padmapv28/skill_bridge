"""
schemas.py

Pydantic models representing request/response payloads and MongoDB collections.
Updated to Pydantic v2 (ConfigDict, no class Config).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _now() -> datetime:
    return datetime.now(timezone.utc)


# =============================================================================
# Auth & User Models
# =============================================================================

class UserBase(BaseModel):
    name: str
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserCreate(UserBase):
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")


class UserInDB(UserBase):
    id: Optional[str] = Field(default=None, alias="_id")
    password_hash: str
    is_verified: bool = True
    created_at: datetime = Field(default_factory=_now)

    model_config = ConfigDict(populate_by_name=True)


class UserPublic(UserBase):
    id: str
    created_at: Optional[datetime] = None


class RegisterResponse(BaseModel):
    message: str
    email: str
    expires_in_seconds: int


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class ResendOtpRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class AuthResponse(BaseModel):
    token: str
    user: dict[str, Any]


# =============================================================================
# Resume Models
# =============================================================================

class ResumeCreate(BaseModel):
    user_id: str
    uploaded_file_name: str
    parsed_data: dict[str, Any]


class ResumeInDB(ResumeCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    uploaded_at: datetime = Field(default_factory=_now)

    model_config = ConfigDict(populate_by_name=True)


class PredictionCreate(BaseModel):
    resume_id: str
    predicted_roles: list[dict[str, Any]]


class PredictionInDB(PredictionCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=_now)

    model_config = ConfigDict(populate_by_name=True)


class RoadmapCreate(BaseModel):
    resume_id: str
    target_role: str
    roadmap_steps: list[dict[str, Any]]


class RoadmapInDB(RoadmapCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=_now)

    model_config = ConfigDict(populate_by_name=True)


# =============================================================================
# Session Models (Task 2)
# =============================================================================

class SessionPredictionsUpdate(BaseModel):
    predictions: Any


class SessionRoleUpdate(BaseModel):
    role: Optional[str] = None
    selected_role: Optional[str] = None


class SessionSkillGapUpdate(BaseModel):
    skill_gap: Any


class SessionRoadmapUpdate(BaseModel):
    roadmap: dict[str, Any]


class SessionResponse(BaseModel):
    user_id: str
    resume: Optional[dict[str, Any]] = None
    predictions: Optional[Any] = None
    selected_role: Optional[str] = None
    skill_gap: Optional[Any] = None
    roadmap: Optional[dict[str, Any]] = None
    roadmap_id: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


# =============================================================================
# Progress Models (Task 3)
# =============================================================================

class ProgressStatusEnum(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class ProgressSkillUpdate(BaseModel):
    phase_number: int
    skill_name: str
    status: ProgressStatusEnum


class PhaseSummary(BaseModel):
    phase_number: int
    percent: int


class ProgressSummaryResponse(BaseModel):
    overall_percent: int
    total: int
    completed: int
    in_progress: int
    not_started: int
    per_phase: list[PhaseSummary]


# =============================================================================
# ATS History Models (Task 4)
# =============================================================================

class AtsHistoryCreate(BaseModel):
    label: str
    jd_snippet: Optional[str] = None
    jd_text: Optional[str] = None
    result: dict[str, Any]


class AtsHistoryResponse(BaseModel):
    id: str
    user_id: str
    label: str
    jd_snippet: str
    result: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)

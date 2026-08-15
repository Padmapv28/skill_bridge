"""Request/response schemas for career prediction endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    resume_id: Optional[str] = Field(None, description="Existing resume to predict from")
    skills: Optional[List[str]] = Field(None, description="Skills to use directly instead of a resume")


class RolePrediction(BaseModel):
    role: str
    fit_score: int
    justification: str


class PredictionResponse(BaseModel):
    id: str
    predictions: List[RolePrediction]


class SkillGapRequest(BaseModel):
    role: str
    resume_id: Optional[str] = None
    skills: Optional[List[str]] = None


class SkillGapResponse(BaseModel):
    role: str
    current_skills: List[str]
    required_skills: List[str]
    matching_skills: List[str]
    missing_skills: List[str]
    skill_gap_percentage: float

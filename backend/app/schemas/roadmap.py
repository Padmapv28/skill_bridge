"""Request/response schemas for roadmap endpoints."""
from typing import List, Optional
from pydantic import BaseModel


class RoadmapGenerateRequest(BaseModel):
    role: str
    missing_skills: Optional[List[str]] = None
    resume_id: Optional[str] = None


class RoadmapPhase(BaseModel):
    phase: int
    title: str
    skills: List[str]
    duration_weeks: int


class RoadmapResponse(BaseModel):
    id: str
    role: str
    roadmap: List[RoadmapPhase]

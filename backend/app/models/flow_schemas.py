"""Request model for POST /flow/analysis (kept separate so models/schemas.py stays untouched)."""
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class FlowAnalysisRequest(BaseModel):
    """Everything produced for the chosen role after the resume upload, saved in one call."""
    atsResult: dict[str, Any]
    skillGapResult: Any
    roadmapResult: dict[str, Any]
    jobDescription: str = ""
    label: Optional[str] = Field(default=None, max_length=200)

    @field_validator("skillGapResult")
    @classmethod
    def skill_gap_not_null(cls, v):
        if v is None:
            raise ValueError("skillGapResult is required")
        return v

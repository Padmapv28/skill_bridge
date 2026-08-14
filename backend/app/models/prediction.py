"""Represents the shape of a `predictions` document stored in MongoDB."""
from datetime import datetime, timezone
from typing import Dict, List, Optional


class PredictionModel:
    def __init__(
        self,
        user_id,
        resume_id: Optional[str],
        predictions: List[Dict],
        created_at: Optional[datetime] = None,
    ):
        self.user_id = user_id
        self.resume_id = resume_id
        self.predictions = predictions
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "resume_id": self.resume_id,
            "predictions": self.predictions,
            "created_at": self.created_at,
        }

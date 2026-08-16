"""Represents the shape of a `roadmaps` document stored in MongoDB."""
from datetime import datetime, timezone
from typing import Dict, List, Optional


class RoadmapModel:
    def __init__(self, user_id, role: str, roadmap: List[Dict], created_at: Optional[datetime] = None):
        self.user_id = user_id
        self.role = role
        self.roadmap = roadmap
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "role": self.role,
            "roadmap": self.roadmap,
            "created_at": self.created_at,
        }

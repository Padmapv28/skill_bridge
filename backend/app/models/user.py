"""Represents the shape of a `users` document stored in MongoDB."""
from datetime import datetime, timezone
from typing import Optional


class UserModel:
    def __init__(self, name: str, email: str, hashed_password: str, created_at: Optional[datetime] = None):
        self.name = name
        self.email = email
        self.hashed_password = hashed_password
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "created_at": self.created_at,
        }

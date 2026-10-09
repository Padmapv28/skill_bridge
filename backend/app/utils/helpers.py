"""
helpers.py

Common utility helpers across the SkillBridge backend.
"""

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status


def parse_object_id(id_str: str, entity_name: str = "resource") -> ObjectId:
    """
    Parse a string into a BSON ObjectId.
    Raises HTTPException(400) if the format is invalid.
    """
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {entity_name} ID format.",
        )

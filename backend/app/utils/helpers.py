"""
General-purpose helpers: MongoDB ObjectId validation and document serialization.
"""
from typing import Any, Dict, Optional

from bson import ObjectId
from bson.errors import InvalidId


def is_valid_object_id(value: str) -> bool:
    """Return True if value is a syntactically valid MongoDB ObjectId."""
    if not value or not isinstance(value, str):
        return False
    try:
        ObjectId(value)
        return True
    except (InvalidId, TypeError):
        return False


def to_object_id(value: str) -> ObjectId:
    return ObjectId(value)


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Convert a MongoDB document into a JSON-serializable dict.

    - Renames `_id` to `id` and converts it to a string.
    - Converts any `user_id` ObjectId field to a string.
    """
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    if "user_id" in doc and isinstance(doc["user_id"], ObjectId):
        doc["user_id"] = str(doc["user_id"])
    return doc

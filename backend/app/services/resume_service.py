"""
Resume business logic: CRUD operations, always scoped to the owning user.
"""
from typing import List

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

from app.utils.helpers import is_valid_object_id, serialize_doc, to_object_id


def create_resume(db: Database, user_id: str, data: dict) -> dict:
    doc = dict(data)
    doc["user_id"] = ObjectId(user_id)
    result = db.resumes.insert_one(doc)
    created = db.resumes.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


def list_resumes(db: Database, user_id: str) -> List[dict]:
    docs = db.resumes.find({"user_id": ObjectId(user_id)})
    return [serialize_doc(d) for d in docs]


def _get_owned_resume(db: Database, user_id: str, resume_id: str) -> dict:
    if not is_valid_object_id(resume_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    doc = db.resumes.find_one({"_id": to_object_id(resume_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    if str(doc["user_id"]) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this resume")
    return doc


def get_resume(db: Database, user_id: str, resume_id: str) -> dict:
    doc = _get_owned_resume(db, user_id, resume_id)
    return serialize_doc(doc)


def update_resume(db: Database, user_id: str, resume_id: str, data: dict) -> dict:
    _get_owned_resume(db, user_id, resume_id)
    update_data = {k: v for k, v in data.items() if v is not None}
    if update_data:
        db.resumes.update_one({"_id": to_object_id(resume_id)}, {"$set": update_data})
    doc = db.resumes.find_one({"_id": to_object_id(resume_id)})
    return serialize_doc(doc)


def delete_resume(db: Database, user_id: str, resume_id: str) -> None:
    _get_owned_resume(db, user_id, resume_id)
    db.resumes.delete_one({"_id": to_object_id(resume_id)})

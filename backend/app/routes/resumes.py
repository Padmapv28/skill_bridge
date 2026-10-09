"""
resumes.py

POST /api/resumes - save parsed resume data linked to the logged-in user
GET  /api/resumes/{id} - fetch one resume by its id
GET  /api/resumes/user/{user_id} - fetch all resumes for a user
"""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from app.database.db import db
from app.models.schemas import ResumeCreate
from app.utils.helpers import parse_object_id
from app.utils.security import get_current_user

router = APIRouter()


def _serialize_resume(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "user_id": doc["user_id"],
        "uploaded_file_name": doc["uploaded_file_name"],
        "parsed_data": doc["parsed_data"],
        "uploaded_at": doc["uploaded_at"],
    }


@router.post("/resumes", status_code=status.HTTP_201_CREATED)
async def create_resume(resume_in: ResumeCreate, current_user: dict = Depends(get_current_user)):
    if resume_in.user_id != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only save resumes under your own account.",
        )

    doc = resume_in.model_dump()
    doc["uploaded_at"] = datetime.now(timezone.utc)
    result = await db.resumes.insert_one(doc)
    created = await db.resumes.find_one({"_id": result.inserted_id})
    return _serialize_resume(created)


@router.get("/resumes/{resume_id}")
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    obj_id = parse_object_id(resume_id, "resume")

    resume = await db.resumes.find_one({"_id": obj_id})
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if resume["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your resume.")

    return _serialize_resume(resume)


@router.get("/resumes/user/{user_id}")
async def get_resumes_for_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own resumes.",
        )

    cursor = db.resumes.find({"user_id": user_id})
    resumes = [_serialize_resume(doc) async for doc in cursor]
    return resumes

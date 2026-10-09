"""
upload.py

POST /api/upload-resume - Authenticated resume upload and parsing route.
Validates file (.pdf, .docx, <= 5 MB), extracts text, parses resume,
persists record to db.resumes, and upserts to db.user_sessions (resetting downstream state).
"""

import logging
import os
import tempfile
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from app.database.db import db
from app.services.resume_extractor import (
    extract_text,
    ResumeExtractionError,
)
from app.services.resume_parser import parse_resume
from app.utils.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.post("/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    original_name = resume.filename or "uploaded_resume"
    ext = os.path.splitext(original_name)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Only .pdf and .docx are accepted.",
        )

    contents = await resume.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large ({len(contents) / (1024 * 1024):.1f} MB). "
                "Maximum allowed size is 5 MB."
            ),
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            raw_text = extract_text(tmp_path)
        except ResumeExtractionError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            logger.error(f"Resume text extraction error: {e}", exc_info=True)
            raise HTTPException(status_code=422, detail=f"Resume text extraction failed: {str(e)}")

        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text could be extracted from the uploaded resume.",
            )

        try:
            parsed_data = parse_resume(raw_text)
        except Exception as e:
            logger.error(f"Resume parsing error: {e}", exc_info=True)
            raise HTTPException(
                status_code=422,
                detail=f"Resume was extracted but could not be parsed into structured data: {str(e)}",
            )

        now = datetime.now(timezone.utc)
        user_id = str(current_user["_id"])

        # 1. Save to db.resumes
        resume_doc = {
            "user_id": user_id,
            "uploaded_file_name": original_name,
            "parsed_data": parsed_data,
            "uploaded_at": now,
        }
        res_insert = await db.resumes.insert_one(resume_doc)
        resume_id = str(res_insert.inserted_id)

        # 2. Upsert to db.user_sessions, resetting downstream state
        session_update = {
            "user_id": user_id,
            "resume": {
                "filename": original_name,
                "parsed_data": parsed_data,
                "uploaded_at": now,
            },
            "predictions": None,
            "selected_role": None,
            "skill_gap": None,
            "roadmap": None,
            "roadmap_id": None,
            "updated_at": now,
        }
        await db.user_sessions.update_one(
            {"user_id": user_id},
            {"$set": session_update},
            upsert=True,
        )

        return {
            "success": True,
            "resumeId": resume_id,
            "filename": original_name,
            "parsedData": parsed_data,
            "predictions": [],
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Could not remove temp file {tmp_path}: {e}")

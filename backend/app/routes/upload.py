"""
upload.py

POST /api/upload-resume - the one missing piece connecting Member A's
resume parser to real file uploads. Accepts a PDF/DOCX file (multipart,
field name "resume" - matches frontend/src/api/resume.js), parses it,
stores it exactly like resumes.py does, and returns { success, resumeId,
parsedData } matching the frontend's expected shape.
"""

import os
import sys
import tempfile
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from app.database.db import db
from app.utils.security import get_current_user

_ML_SRC = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "ml", "src")
)
if _ML_SRC not in sys.path:
    sys.path.insert(0, _ML_SRC)

from resume_extractor import extract_text, ResumeExtractionError  # noqa: E402
from resume_parser import parse_resume  # noqa: E402

router = APIRouter()


@router.post("/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ext = os.path.splitext(resume.filename or "")[1].lower()
    if ext not in (".pdf", ".docx"):
        raise HTTPException(status_code=400, detail="Only .pdf and .docx files are supported.")

    contents = await resume.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            raw_text = extract_text(tmp_path)
        except ResumeExtractionError as e:
            raise HTTPException(status_code=422, detail=str(e))

        parsed_data = parse_resume(raw_text)

        doc = {
            "user_id": str(current_user["_id"]),
            "uploaded_file_name": resume.filename,
            "parsed_data": parsed_data,
            "uploaded_at": datetime.utcnow(),
        }
        result = await db.resumes.insert_one(doc)

        return {
            "success": True,
            "resumeId": str(result.inserted_id),
            "parsedData": parsed_data,
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

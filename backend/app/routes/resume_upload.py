"""
Resume upload and parsing route.

Accepts PDF/DOCX resumes, extracts text, and converts the
resume into structured data.

IMPORTANT:
Role prediction is NOT performed during upload.
This prevents the upload request from waiting for Ollama.
"""

import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.services.resume_extractor import (
    extract_text,
    ResumeExtractionError,
)
from app.services.resume_parser import parse_resume


router = APIRouter()

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.post("/upload-resume")
async def upload_resume(
    resume: UploadFile = File(...)
):
    """
    Upload a PDF/DOCX resume.

    Flow:
        1. Validate file
        2. Extract text
        3. Parse resume
        4. Return parsed resume

    AI role prediction is intentionally handled separately.
    """

    original_name = resume.filename or ""
    ext = os.path.splitext(original_name)[1].lower()

    # ---------------------------------------------------------
    # Validate extension
    # ---------------------------------------------------------

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                "Only .pdf and .docx are accepted."
            ),
        )

    # ---------------------------------------------------------
    # Read uploaded file
    # ---------------------------------------------------------

    contents = await resume.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # ---------------------------------------------------------
    # Validate file size
    # ---------------------------------------------------------

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large "
                f"({len(contents) / (1024 * 1024):.1f} MB). "
                "Maximum allowed size is 5 MB."
            ),
        )

    tmp_path = None

    try:
        # -----------------------------------------------------
        # Save temporary file
        # -----------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=ext,
        ) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # -----------------------------------------------------
        # Step 1: Extract text
        # -----------------------------------------------------

        try:
            raw_text = extract_text(tmp_path)

        except ResumeExtractionError as e:
            raise HTTPException(
                status_code=422,
                detail=str(e),
            )

        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Resume text extraction failed: {e}",
            )

        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text could be extracted from "
                    "the uploaded resume."
                ),
            )

        print(
            f"[Resume Upload] Extracted "
            f"{len(raw_text)} characters from {original_name}"
        )

        # -----------------------------------------------------
        # Step 2: Parse resume
        # -----------------------------------------------------

        try:
            parsed_data = parse_resume(raw_text)

        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Resume was extracted but could not be "
                    f"parsed into structured data: {e}"
                ),
            )

        print(
            "[Resume Upload] Resume parsed successfully"
        )

        # -----------------------------------------------------
        # Step 3: RETURN IMMEDIATELY
        #
        # Do NOT call predict_roles() here.
        # Ollama role prediction is handled separately.
        # -----------------------------------------------------

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "resumeId": None,
                "filename": original_name,
                "parsedData": parsed_data,
                "predictions": [],
            },
        )

    finally:
        # -----------------------------------------------------
        # Remove temporary file
        # -----------------------------------------------------

        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
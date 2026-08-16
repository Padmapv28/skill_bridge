"""
main.py

FastAPI application exposing POST /api/upload-resume.

Accepts a PDF or DOCX resume upload, runs it through extract_text() and
parse_resume(), and returns the structured JSON schema documented in
docs/resume_fields.md.

Run locally with:
    uvicorn main:app --reload

Then test at http://127.0.0.1:8000/docs (interactive Swagger UI).
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os

from resume_extractor import extract_text, ResumeExtractionError
from resume_parser import parse_resume

app = FastAPI(
    title="Resume Parser API",
    description="Member A deliverable -- extracts structured data from PDF/DOCX resumes.",
    version="1.0.0",
)

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@app.get("/")
def root():
    """Simple health check."""
    return {"status": "ok", "message": "Resume Parser API is running"}


@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Accepts a resume file upload (PDF or DOCX), extracts and parses it,
    and returns structured JSON.

    Responses:
        200: structured resume JSON (see docs/resume_fields.md for schema)
        400: bad file (wrong type or too large)
        422: file was valid but could not be extracted/parsed
            (e.g. corrupted file, scanned/image-only PDF)
    """
    original_name = file.filename or ""
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Only .pdf and .docx are accepted.",
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents) / (1024*1024):.1f} MB). "
                   f"Maximum allowed size is 5 MB.",
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

        try:
            result = parse_resume(raw_text)
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Resume was extracted but could not be parsed into structured data: {e}",
            )

        return JSONResponse(status_code=200, content=result)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

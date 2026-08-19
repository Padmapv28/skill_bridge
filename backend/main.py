"""
main.py

FastAPI entry point for the SkillBridge backend (Member C).

Run locally with:
    uvicorn main:app --reload

Then test at http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, career
app = FastAPI(
    title="SkillBridge Backend API",
    description="Auth, resume storage, and orchestration for the SkillBridge platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(career.router, prefix="/api/career", tags=["career"])


@app.get("/")
def root():
    return {"status": "ok", "message": "SkillBridge Backend API is running"}

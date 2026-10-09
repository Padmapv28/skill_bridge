"""
main.py

FastAPI entry point for the SkillBridge backend (Member C).
Configures middleware, MongoDB index lifespan, and registers all API routers.

Run locally with:
    uvicorn main:app --reload

Then test at http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.indexes import init_indexes
from app.routes import (
    health,
    career,
    auth,
    upload,
    resumes,
    session,
    progress,
    ats_history,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB collections and indexes on startup
    await init_indexes()
    yield


app = FastAPI(
    title="SkillBridge Backend API",
    description="Auth, resume storage, and orchestration for the SkillBridge platform.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Health check
app.include_router(
    health.router,
    prefix="/api",
    tags=["health"],
)

# 2. Career prediction, skill gap and roadmap (Member B services)
app.include_router(
    career.router,
    prefix="/api/career",
    tags=["career"],
)

# 3. Authentication & OTP verification
app.include_router(
    auth.router,
    prefix="/api",
    tags=["auth"],
)

# 4. Authenticated resume upload & session persistence (replaces resume_upload)
app.include_router(
    upload.router,
    prefix="/api",
    tags=["resume"],
)

# 5. Saved resumes management
app.include_router(
    resumes.router,
    prefix="/api",
    tags=["resumes"],
)

# 6. User session persistence
app.include_router(
    session.router,
    prefix="/api/session",
    tags=["session"],
)

# 7. Roadmap progress tracking
app.include_router(
    progress.router,
    prefix="/api/progress",
    tags=["progress"],
)

# 8. ATS evaluation history
app.include_router(
    ats_history.router,
    prefix="/api/ats-history",
    tags=["ats-history"],
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SkillBridge Backend API is running",
    }
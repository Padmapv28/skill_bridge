
"""
main.py

FastAPI entry point for the SkillBridge backend.
Configures CORS, MongoDB indexes, Ollama warm-up, and API routers.

Run locally with:
    python -m uvicorn main:app --reload --port 8000

API documentation:
    http://127.0.0.1:8000/docs
"""

import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.indexes import init_indexes
from app.services.ollama_client import warm_up
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


# ---------------------------------------------------------
# ENVIRONMENT CONFIGURATION
# ---------------------------------------------------------

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

IS_PRODUCTION = ENVIRONMENT in {"production", "prod"}

# Always include the configured frontend origin.
configured_origin = str(
    settings.FRONTEND_ORIGIN or ""
).strip().rstrip("/")

allowed_origins = set()

if configured_origin:
    allowed_origins.add(configured_origin)

# Permit common local Vite origins only during development.
if not IS_PRODUCTION:
    allowed_origins.update({
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    })

# Fail clearly rather than silently accepting requests from any origin.
if not allowed_origins:
    raise RuntimeError(
        "No frontend origins configured. Set FRONTEND_ORIGIN "
        "to your frontend URL."
    )


# ---------------------------------------------------------
# APPLICATION LIFESPAN
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize required MongoDB indexes before serving requests.
    await init_indexes()

    # Warm up the local Ollama model in the background.
    threading.Thread(
        target=warm_up,
        daemon=True,
        name="ollama-warmup",
    ).start()

    yield


# ---------------------------------------------------------
# FASTAPI APPLICATION
# ---------------------------------------------------------

app = FastAPI(
    title="SkillBridge Backend API",
    description="Authentication, resume storage, career prediction, "
                "skill-gap analysis, ATS scoring, and career roadmap APIs.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS MIDDLEWARE
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API ROUTER REGISTRATION
# ---------------------------------------------------------

# 1. Health check
app.include_router(
    health.router,
    prefix="/api",
    tags=["health"],
)

# 2. Career prediction, skill-gap analysis, and roadmap
app.include_router(
    career.router,
    prefix="/api/career",
    tags=["career"],
)

# 3. Authentication and email OTP verification
app.include_router(
    auth.router,
    prefix="/api",
    tags=["auth"],
)

# 4. Authenticated resume upload and session persistence
app.include_router(
    upload.router,
    prefix="/api",
    tags=["resume"],
)

# 5. Saved resume management
app.include_router(
    resumes.router,
    prefix="/api",
    tags=["resumes"],
)

# 6. Current user session persistence
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


# ---------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SkillBridge Backend API is running",
        "environment": ENVIRONMENT,
    }

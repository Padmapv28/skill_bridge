"""
AI Career Role Predictor & Roadmap Generator - FastAPI application entrypoint.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database.mongodb import close_mongo_connection, connect_to_mongo
from app.routes import auth, health, predictions, resumes, roadmaps


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt to connect on startup.
    # connect_to_mongo() never raises - the app must keep running
    # even if MongoDB is unreachable.
    connect_to_mongo()
    yield
    close_mongo_connection()


app = FastAPI(
    title="AI Career Role Predictor API",
    description=(
        "Backend API for the AI Career Role Predictor & Roadmap Generator. "
        "Provides authentication, resume management, rule-based career role "
        "prediction, skill-gap analysis, and roadmap generation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# CORS configuration.
# NOTE: allow_origins=["*"] is convenient for local frontend development.
# In production, restrict this to the frontend's actual origin(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    """Return clean 422 responses for request validation errors."""

    errors = []

    for error in exc.errors():
        errors.append(
            {
                "loc": error.get("loc"),
                "msg": error.get("msg"),
                "type": error.get("type"),
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
):
    """Catch-all handler: never leak stack traces or internals to clients."""

    logger.exception(
        "Unhandled error while processing %s %s",
        request.method,
        request.url,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.get(
    "/",
    tags=["Health"],
    summary="Root health check",
)
def root():
    return {
        "message": "AI Career Role Predictor API is running"
    }


# Register API routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(resumes.analyze_router)
app.include_router(predictions.router)
app.include_router(roadmaps.router)
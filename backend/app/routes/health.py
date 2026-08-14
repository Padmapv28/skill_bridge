"""Health check endpoints for the API and its database connection."""
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.mongodb import is_connected

router = APIRouter(tags=["Health"])


@router.get("/api/health", summary="API health check")
def health_check():
    return {"status": "ok"}


@router.get("/api/health/database", summary="Database health check")
def database_health():
    connected = is_connected()
    payload = {
        "status": "connected" if connected else "disconnected",
        "database": settings.DATABASE_NAME,
    }
    status_code = status.HTTP_200_OK if connected else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=payload)

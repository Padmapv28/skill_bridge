"""Liveness / readiness probes for hosting platforms. Include WITHOUT the /api prefix."""
import logging

from fastapi import APIRouter, HTTPException

from app.database.db import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Ops"])


@router.get("/healthz")
async def healthz():
    """Process is up (no dependencies touched)."""
    return {"status": "ok"}


@router.get("/readyz")
async def readyz():
    """Process is up AND MongoDB answers."""
    try:
        await db.command("ping")
    except Exception:
        logger.exception("Readiness check failed")
        raise HTTPException(status_code=503, detail="Database not reachable")
    return {"status": "ready"}

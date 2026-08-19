"""
health.py

Simple health-check route. Also useful for confirming the Mongo
connection is alive.
"""

from fastapi import APIRouter
from app.database.db import db

router = APIRouter()


@router.get("/health")
async def health_check():
    try:
        await db.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {e}"

    return {"status": "ok", "mongo": mongo_status}

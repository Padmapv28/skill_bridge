"""
indexes.py

MongoDB index creation called during FastAPI lifespan startup.
Creates necessary unique and TTL indexes across collections.
"""

import logging
from app.database.db import db

logger = logging.getLogger(__name__)


async def init_indexes() -> None:
    """
    Ensure all required indexes exist in MongoDB.
    """
    try:
        # TTL index for pending registrations (expires automatically after expires_at)
        await db.pending_registrations.create_index("expires_at", expireAfterSeconds=0)

        # Unique index on user email
        await db.users.create_index("email", unique=True)

        # Unique index on user_sessions.user_id (one session per user)
        await db.user_sessions.create_index("user_id", unique=True)

        # Unique compound index on roadmap_progress (roadmap_id, phase_number, skill_name)
        await db.roadmap_progress.create_index(
            [("roadmap_id", 1), ("phase_number", 1), ("skill_name", 1)],
            unique=True,
        )

        # Index for querying ATS history by user sorted by creation time
        await db.ats_history.create_index(
            [("user_id", 1), ("created_at", -1)]
        )

        logger.info("MongoDB indexes successfully created/verified.")
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}", exc_info=True)

"""
Reusable MongoDB connection logic.

The application must not crash if MongoDB is unavailable at startup or at
any point during its lifetime - connection state is tracked and surfaced
via the /api/health/database endpoint, and any route that needs the
database will return a 503 if it is not reachable.
"""
import logging
from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.config import settings

logger = logging.getLogger(__name__)


class MongoDB:
    client: Optional[MongoClient] = None
    db: Optional[Database] = None
    connected: bool = False


mongodb = MongoDB()


def connect_to_mongo() -> None:
    """Attempt to connect to MongoDB. Failures are logged, not raised."""
    try:
        mongodb.client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
        # Force a round trip so connection issues surface immediately.
        mongodb.client.admin.command("ping")
        mongodb.db = mongodb.client[settings.DATABASE_NAME]
        mongodb.connected = True
        logger.info("Connected to MongoDB at %s (database=%s)", settings.MONGODB_URL, settings.DATABASE_NAME)
    except PyMongoError as exc:
        mongodb.client = None
        mongodb.db = None
        mongodb.connected = False
        logger.warning("Could not connect to MongoDB: %s", exc)


def close_mongo_connection() -> None:
    if mongodb.client is not None:
        mongodb.client.close()
    mongodb.client = None
    mongodb.db = None
    mongodb.connected = False


def get_db() -> Optional[Database]:
    """
    FastAPI dependency that returns the current database instance.

    Returns None if MongoDB is not currently connected - routes are
    responsible for handling that case (typically with a 503 response).
    In tests, this dependency is overridden with a mongomock database.
    """
    return mongodb.db


def is_connected() -> bool:
    """Actively check whether MongoDB is reachable right now."""
    if mongodb.client is None:
        return False
    try:
        mongodb.client.admin.command("ping")
        mongodb.connected = True
        return True
    except PyMongoError:
        mongodb.connected = False
        return False

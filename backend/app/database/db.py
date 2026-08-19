"""
db.py

Async MongoDB connection via Motor. Import `db` anywhere you need to
read/write a collection, e.g.:

    from app.database.db import db
    await db.users.find_one({"email": email})
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client = AsyncIOMotorClient(settings.MONGO_URI)
db = _client[settings.MONGO_DB_NAME]

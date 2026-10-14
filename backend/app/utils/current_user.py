"""Adapter so Member C routes work whatever get_current_user returns
(dict, object, or plain id string)."""
from fastapi import Depends, HTTPException

from app.utils.security import get_current_user


def get_user_id(user) -> str:
    if isinstance(user, str):
        return user
    if isinstance(user, dict):
        for key in ("id", "_id", "user_id", "sub"):
            if user.get(key):
                return str(user[key])
    for key in ("id", "_id", "user_id"):
        value = getattr(user, key, None)
        if value:
            return str(value)
    raise HTTPException(status_code=401, detail="Invalid authentication credentials")


async def current_user_id(user=Depends(get_current_user)) -> str:
    return get_user_id(user)

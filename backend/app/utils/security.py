"""
security.py

Password hashing (bcrypt) and JWT creation/verification, plus the
get_current_user dependency used to protect routes.
"""

import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from bson import ObjectId
from bson.errors import InvalidId

from app.config import settings
from app.database.db import db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def hash_password(plain_password: str) -> str:
    pw_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    pw_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pw_bytes, password_hash.encode("utf-8"))


def hash_otp(otp: str) -> str:
    """Compute HMAC-SHA256 of OTP using the JWT secret key."""
    return hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        otp.strip().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except InvalidId:
        raise credentials_exception

    if user is None:
        raise credentials_exception

    return user

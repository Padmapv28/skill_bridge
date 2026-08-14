"""
Authentication business logic: registration, login, and the reusable
get_current_user() dependency used to protect routes.
"""
from datetime import timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.database import Database

from app.config import settings
from app.database.mongodb import get_db
from app.utils.helpers import is_valid_object_id, serialize_doc, to_object_id
from app.utils.security import create_access_token, decode_access_token, hash_password, verify_password

# Swagger will render an "Authorize" button using this Bearer scheme.
security_scheme = HTTPBearer()


def register_user(db: Database, name: str, email: str, password: str) -> dict:
    """Create a new user. Raises 409 if the email is already registered."""
    existing = db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "name": name,
        "email": email,
        "hashed_password": hash_password(password),
    }
    result = db.users.insert_one(user_doc)
    return {
        "id": str(result.inserted_id),
        "name": name,
        "email": email,
        "message": "User registered successfully",
    }


def authenticate_user(db: Database, email: str, password: str) -> str:
    """Verify credentials and return a signed JWT access token."""
    user = db.users.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(
        {"sub": str(user["_id"])},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return token


def get_user_by_id(db: Database, user_id: str) -> Optional[dict]:
    if not is_valid_object_id(user_id):
        return None
    user = db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        return None
    user.pop("hashed_password", None)
    return serialize_doc(user)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Database = Depends(get_db),
) -> dict:
    """
    Reusable FastAPI dependency that resolves the currently authenticated
    user from a Bearer JWT token. Raises 401 on any authentication failure
    and 503 if the database is unavailable.
    """
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

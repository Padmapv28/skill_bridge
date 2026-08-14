"""Authentication routes: register, login, current-user profile."""
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database.mongodb import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserProfileResponse,
)
from app.services import auth_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _require_db(db: Database) -> Database:
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return db


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: RegisterRequest, db: Database = Depends(get_db)):
    db = _require_db(db)
    return auth_service.register_user(db, payload.name, payload.email, payload.password)


@router.post("/login", response_model=TokenResponse, summary="Log in and receive a JWT access token")
def login(payload: LoginRequest, db: Database = Depends(get_db)):
    db = _require_db(db)
    token = auth_service.authenticate_user(db, payload.email, payload.password)
    return TokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get the authenticated user's profile",
)
def me(current_user: dict = Depends(get_current_user)):
    return current_user

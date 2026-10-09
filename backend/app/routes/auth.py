"""
auth.py

Authentication endpoints with email OTP verification:
    POST /api/register   -> Staged registration, generates & hashes OTP, returns 200 { message, email, expires_in_seconds }
    POST /api/verify-otp -> Verifies OTP, persists user to db.users, returns { token, user: {id, name, email} }
    POST /api/resend-otp -> Resends OTP with 60-second cooldown and max 5 attempts
    POST /api/login      -> Authenticates user (handles legacy accounts without is_verified)
    GET  /api/me         -> Current authenticated user profile
    POST /api/logout     -> Confirms logout
"""

import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, status, Depends

from app.database.db import db
from app.models.schemas import (
    UserCreate,
    RegisterResponse,
    VerifyOtpRequest,
    ResendOtpRequest,
    LoginRequest,
    AuthResponse,
)
from app.utils.email import send_otp_email
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    hash_otp,
)

logger = logging.getLogger(__name__)

router = APIRouter()

OTP_EXPIRY_MINUTES = 10
MAX_VERIFY_ATTEMPTS = 5
MAX_RESEND_COUNT = 5
RESEND_COOLDOWN_SECONDS = 60


def _user_public(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
    }


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_200_OK,
    summary="Register new user (dispatches verification OTP)",
)
async def register(user_in: UserCreate):
    normalized_email = user_in.email.strip().lower()

    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    existing_user = await db.users.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Generate a cryptographically secure 6-digit OTP
    otp = f"{secrets.randbelow(1_000_000):06d}"
    otp_hashed = hash_otp(otp)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    pending_doc = {
        "name": user_in.name.strip(),
        "email": normalized_email,
        "password_hash": hash_password(user_in.password),
        "otp_hash": otp_hashed,
        "expires_at": expires_at,
        "attempts": 0,
        "resend_count": 0,
        "last_sent_at": now,
    }

    # Upsert by email so repeated registrations before verification refresh the request
    await db.pending_registrations.update_one(
        {"email": normalized_email},
        {"$set": pending_doc},
        upsert=True,
    )

    email_sent = await send_otp_email(normalized_email, otp)
    if not email_sent:
        # Don't leave a usable pending record on failure
        await db.pending_registrations.delete_one({"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send verification email. Please check your email configuration or try again.",
        )

    return RegisterResponse(
        message="Verification OTP sent to your email.",
        email=normalized_email,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
    )


@router.post(
    "/verify-otp",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify registration OTP and activate user account",
)
async def verify_otp(body: VerifyOtpRequest):
    normalized_email = body.email.strip().lower()
    pending = await db.pending_registrations.find_one({"email": normalized_email})

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email.",
        )

    now = datetime.now(timezone.utc)
    expires_at = _ensure_utc(pending["expires_at"])

    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="OTP has expired. Please request a new one.",
        )

    current_attempts = pending.get("attempts", 0)
    if current_attempts >= MAX_VERIFY_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new OTP.",
        )

    incoming_hash = hash_otp(body.otp)
    if not hmac.compare_digest(incoming_hash, pending["otp_hash"]):
        new_attempts = current_attempts + 1
        await db.pending_registrations.update_one(
            {"_id": pending["_id"]},
            {"$set": {"attempts": new_attempts}},
        )

        remaining = max(0, MAX_VERIFY_ATTEMPTS - new_attempts)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed attempts. Please request a new OTP.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    # Insert verified user into db.users
    user_doc = {
        "name": pending["name"],
        "email": pending["email"],
        "password_hash": pending["password_hash"],
        "is_verified": True,
        "created_at": now,
    }
    result = await db.users.insert_one(user_doc)
    created_user = await db.users.find_one({"_id": result.inserted_id})

    # Remove pending record
    await db.pending_registrations.delete_one({"_id": pending["_id"]})

    token = create_access_token(data={"sub": str(created_user["_id"])})
    return {
        "token": token,
        "user": _user_public(created_user),
    }


@router.post(
    "/resend-otp",
    response_model=RegisterResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend registration OTP",
)
async def resend_otp(body: ResendOtpRequest):
    normalized_email = body.email.strip().lower()
    pending = await db.pending_registrations.find_one({"email": normalized_email})

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found for this email.",
        )

    now = datetime.now(timezone.utc)
    last_sent_at = _ensure_utc(pending.get("last_sent_at", now - timedelta(days=1)))
    elapsed_seconds = (now - last_sent_at).total_seconds()

    if elapsed_seconds < RESEND_COOLDOWN_SECONDS:
        seconds_remaining = int(RESEND_COOLDOWN_SECONDS - elapsed_seconds)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {seconds_remaining} second(s) before requesting a new OTP.",
        )

    resend_count = pending.get("resend_count", 0)
    if resend_count >= MAX_RESEND_COUNT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum resend attempts reached. Please register again.",
        )

    new_otp = f"{secrets.randbelow(1_000_000):06d}"
    email_sent = await send_otp_email(normalized_email, new_otp)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send verification email. Please try again later.",
        )

    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.pending_registrations.update_one(
        {"_id": pending["_id"]},
        {
            "$set": {
                "otp_hash": hash_otp(new_otp),
                "expires_at": expires_at,
                "attempts": 0,
                "resend_count": resend_count + 1,
                "last_sent_at": now,
            }
        },
    )

    return RegisterResponse(
        message="Verification OTP sent to your email.",
        email=normalized_email,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: LoginRequest):
    normalized_email = credentials.email.strip().lower()
    user = await db.users.find_one({"email": normalized_email})

    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    # Compatibility: treat missing is_verified as verified (for legacy users)
    if user.get("is_verified", True) is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not verified. Please verify your email with OTP.",
        )

    token = create_access_token(data={"sub": str(user["_id"])})
    return {
        "token": token,
        "user": _user_public(user),
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_public(current_user)


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"success": True}

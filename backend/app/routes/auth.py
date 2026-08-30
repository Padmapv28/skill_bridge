"""
auth.py

Matches the frontend's actual expected contract (frontend/src/api/auth.js):

    POST /api/register  { name, email, password } -> { token, user }
    POST /api/login      { email, password }        -> { token, user }
    GET  /api/me          (Bearer token)             -> user profile
    POST /api/logout     (Bearer token)              -> { success: true }
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr

from app.database.db import db
from app.models.schemas import UserCreate
from app.utils.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def _user_public(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "email": doc["email"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user_doc = {
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": hash_password(user_in.password),
    }
    result = await db.users.insert_one(user_doc)
    created = await db.users.find_one({"_id": result.inserted_id})

    token = create_access_token(data={"sub": str(created["_id"])})
    return {"token": token, "user": _user_public(created)}


@router.post("/login")
async def login(credentials: LoginRequest):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token(data={"sub": str(user["_id"])})
    return {"token": token, "user": _user_public(user)}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return _user_public(current_user)


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # JWTs are stateless - nothing to invalidate server-side without a
    # token blocklist, which is out of scope here. This just confirms
    # the token was valid; the frontend clears its stored token itself.
    return {"success": True}

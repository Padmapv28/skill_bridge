"""Request/response schemas for authentication endpoints."""
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars, letters + numbers)")

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("Password must contain both letters and numbers")
        return v


class RegisterResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

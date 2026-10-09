"""
config.py

Centralized settings, loaded from environment variables (via a .env file
in local dev). Never commit real secrets - .env is gitignored; only
.env.example (with placeholder values) is checked in.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "skillbridge")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "changeme-in-.env")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@skillbridge.local")
    OTP_DEV_MODE: bool = os.getenv("OTP_DEV_MODE", "false").lower() in ("true", "1", "yes")


settings = Settings()

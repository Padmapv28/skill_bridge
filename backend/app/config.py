"""
Application configuration, loaded from environment variables.

All secrets and environment-specific values must come from the environment
(or a local .env file during development) - never hard-coded here.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "career_predictor")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change_this_secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


settings = Settings()

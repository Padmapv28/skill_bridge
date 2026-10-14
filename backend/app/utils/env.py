"""Read a setting from Settings if it has it, else the environment, else the local .env file.

Lets the new features (jobs) work without editing app/config.py: just set ADZUNA_APP_ID etc.
on the host (or in backend/.env for local runs).
"""
import os
from pathlib import Path

from app.config import settings

_TRUE = {"1", "true", "yes", "on"}
_dotenv_cache = None


def _dotenv() -> dict:
    global _dotenv_cache
    if _dotenv_cache is None:
        values: dict = {}
        try:
            from dotenv import dotenv_values  # installed with pydantic-settings

            path = Path(__file__).resolve().parents[2] / ".env"
            if path.exists():
                values = {k: v for k, v in dotenv_values(path).items() if v is not None}
        except Exception:
            values = {}
        _dotenv_cache = values
    return _dotenv_cache


def setting(name: str, default=None):
    value = getattr(settings, name, None)
    if value is None or value == "":
        value = os.getenv(name)
    if value is None or value == "":
        value = _dotenv().get(name)
    return default if value is None or value == "" else value


def setting_int(name: str, default: int) -> int:
    try:
        return int(setting(name, default))
    except (TypeError, ValueError):
        return default


def setting_bool(name: str, default: bool = False) -> bool:
    value = setting(name, default)
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in _TRUE

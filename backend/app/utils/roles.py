"""Helpers for the "role" value, which the frontend sends as a string or an object."""
import re

_ROLE_KEYS = ("title", "role", "name", "label")


def role_title(value, _depth: int = 0) -> str:
    """Best-effort human title from 'Backend Developer', {'title': ...}, {'role': ...}, etc."""
    if isinstance(value, str):
        return " ".join(value.split())
    if isinstance(value, dict) and _depth < 3:
        for key in _ROLE_KEYS:
            found = role_title(value.get(key), _depth + 1)
            if found:
                return found
    return ""


def normalize_role(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").casefold()).strip()


def same_role(a: str, b: str) -> bool:
    na, nb = normalize_role(a), normalize_role(b)
    return bool(na) and na == nb


def session_role(sess: dict) -> str:
    """The role the journey is about: the saved selected_role (set by the existing flow or by
    /flow/analysis), else the target role picked before the resume upload."""
    sess = sess or {}
    return role_title(sess.get("selected_role")) or role_title(sess.get("target_role"))

"""Has the user finished every skill in their roadmap?

Mirrors how routes/session.py seeds roadmap_progress (phase number from "phase" / "phase_number",
skill name = str(skill).strip()) and ALSO accepts the skill's own name when a roadmap skill is an
object, because the frontend marks progress by skill name.

The roadmap saved in the session says WHICH skills exist; roadmap_progress says which are completed.
Counting progress rows alone would be wrong: rows created lazily by the frontend only exist for
skills the user touched, so one completed skill would look like 100%.
"""
from typing import Any


def _names(skill) -> tuple:
    """Acceptable progress names for one roadmap skill; the first is the preferred one."""
    out = []
    if isinstance(skill, dict):
        for key in ("name", "skill", "title"):
            v = skill.get(key)
            if isinstance(v, str) and v.strip():
                out.append(v.strip())
                break
    text = str(skill).strip() if skill is not None else ""
    if text and text not in out:
        out.append(text)
    return tuple(out)


def _phase_number(phase: dict, idx: int) -> int:
    number = phase.get("phase")
    if number is None:
        number = phase.get("phase_number", phase.get("phaseNumber", idx))
    try:
        return int(number)
    except (TypeError, ValueError):
        return idx


def expected_skills(roadmap: Any) -> list:
    """[(phase_number, (name, alt_name...)), ...] one entry per distinct (phase, skill)."""
    out: list = []
    if not isinstance(roadmap, dict):
        return out
    phases = roadmap.get("phases")
    if not isinstance(phases, list):
        return out
    seen = set()
    for idx, phase in enumerate(phases, start=1):
        if not isinstance(phase, dict):
            continue
        number = _phase_number(phase, idx)
        skills = phase.get("skills") or []
        if not isinstance(skills, list):
            continue
        for skill in skills:
            names = _names(skill)
            if not names or (number, names[0]) in seen:
                continue
            seen.add((number, names[0]))
            out.append((number, names))
    return out


def build_progress_docs(user_id: str, roadmap_id: str, roadmap: Any, now) -> list:
    return [
        {
            "user_id": user_id, "roadmap_id": roadmap_id, "phase_number": number, "skill_name": names[0],
            "status": "not_started", "completed_at": None, "updated_at": now,
        }
        for number, names in expected_skills(roadmap)
    ]


def compute_completion(expected: list, completed: set) -> dict:
    total = len(expected)
    done = sum(1 for number, names in expected if any((number, n) in completed for n in names))
    return {
        "total": total,
        "completed": done,
        "percent": round(done / total * 100) if total else 0,
        "complete": total > 0 and done == total,
    }


async def completion_status(db, user_id: str, roadmap_id: str, roadmap: Any) -> dict:
    rows = await db.roadmap_progress.find(
        {"user_id": user_id, "roadmap_id": roadmap_id, "status": "completed"}
    ).to_list(length=None)
    completed = {(r.get("phase_number"), r.get("skill_name")) for r in rows}
    return compute_completion(expected_skills(roadmap), completed)

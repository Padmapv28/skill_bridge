"""Route tests for the role-first flow + jobs. They use an in-memory MongoDB (mongomock-motor) and
bypass login by overriding get_current_user: send header  X-Test-User: <any id>  to act as that user.
The REAL session.py and progress.py routers are mounted, so these tests also prove the new code
agrees with how your existing routes store data."""
from datetime import datetime, timezone

import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

import app.database.db as dbmod

dbmod.db = AsyncMongoMockClient(tz_aware=True)["skillbridge_test"]  # BEFORE routes import `db`

from fastapi import FastAPI, HTTPException, Request  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.routes import flow, jobs, ops, progress, session  # noqa: E402
from app.utils.security import get_current_user  # noqa: E402


async def fake_user(request: Request):
    uid = request.headers.get("x-test-user")
    if not uid:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    return {"_id": uid, "email": f"{uid}@example.com"}


def build_app() -> FastAPI:
    application = FastAPI()
    application.include_router(session.router, prefix="/api/session")
    application.include_router(progress.router, prefix="/api/progress")
    application.include_router(flow.router, prefix="/api")
    application.include_router(jobs.router, prefix="/api")
    application.include_router(ops.router)
    application.dependency_overrides[get_current_user] = fake_user
    return application


@pytest_asyncio.fixture
async def client():
    for name in await dbmod.db.list_collection_names():
        await dbmod.db[name].delete_many({})
    async with AsyncClient(transport=ASGITransport(app=build_app()), base_url="http://test") as c:
        yield c


def as_user(name="alice"):
    return {"X-Test-User": name}


async def simulate_upload(user="alice", filename="cv.pdf"):
    """Does exactly what routes/upload.py does to the session after parsing a resume."""
    now = datetime.now(timezone.utc)
    await dbmod.db.user_sessions.update_one(
        {"user_id": user},
        {"$set": {
            "user_id": user,
            "resume": {"filename": filename, "parsed_data": {"skills": ["python"]}, "uploaded_at": now},
            "predictions": None, "selected_role": None, "skill_gap": None,
            "roadmap": None, "roadmap_id": None, "updated_at": now,
        }},
        upsert=True,
    )


ROADMAP = {
    "role": "Backend Developer",
    "phases": [
        {"phase": 1, "title": "Basics", "skills": ["Python", "Git"]},
        {"phase": 2, "title": "Web", "skills": ["FastAPI", "MongoDB", "Docker"]},
    ],
}
SKILLS = [(p["phase"], s) for p in ROADMAP["phases"] for s in p["skills"]]
ATS = {"score": 72, "matched": ["python"], "missing": ["docker"]}
GAP = {"missing": ["Docker"]}


def analysis_body(**extra):
    return {"atsResult": ATS, "skillGapResult": GAP, "roadmapResult": ROADMAP, **extra}


async def complete_skills(client, user, rid, skills=SKILLS):
    for phase, skill in skills:
        r = await client.patch(f"/api/progress/{rid}/skill", headers=as_user(user),
                               json={"phase_number": phase, "skill_name": skill, "status": "completed"})
        assert r.status_code == 200, r.text

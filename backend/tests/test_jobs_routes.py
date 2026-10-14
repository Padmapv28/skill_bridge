import pytest

from app.routes import jobs as jobs_routes
from app.services import jobs as jobs_service
from tests.conftest import SKILLS, analysis_body, as_user, complete_skills, simulate_upload

pytestmark = pytest.mark.asyncio

FAKE = {"jobs": [{"title": "Backend Dev", "company": "Acme", "url": "https://x.test/1", "source": "Adzuna"}],
        "source": "adzuna", "total": 1, "note": None}


async def _ready(client, user="alice"):
    h = as_user(user)
    await client.put("/api/flow/target-role", headers=h, json={"role": "Backend Developer"})
    await simulate_upload(user)
    rid = (await client.post("/api/flow/analysis", headers=h, json=analysis_body())).json()["roadmapId"]
    return h, rid


async def test_requires_auth(client):
    assert (await client.get("/api/jobs/recommendations")).status_code == 401


async def test_locked_until_roadmap_complete(client):
    h, rid = await _ready(client)
    r = await client.get("/api/jobs/recommendations", headers=h)
    assert r.status_code == 409 and "0 of 5" in r.json()["detail"]
    await complete_skills(client, "alice", rid, SKILLS[:4])
    r = await client.get("/api/jobs/recommendations", headers=h)
    assert r.status_code == 409 and "4 of 5" in r.json()["detail"]
    assert (await client.get("/api/flow/state", headers=h)).json()["jobsUnlocked"] is False


async def test_unlocked_after_completion_returns_jobs_and_links(client, monkeypatch):
    seen = {}

    async def fake_find(db, role, location, country, page, limit):
        seen.update(role=role, location=location, country=country, page=page, limit=limit)
        return FAKE

    monkeypatch.setattr(jobs_routes, "find_jobs", fake_find)
    h, rid = await _ready(client)
    await complete_skills(client, "alice", rid)
    r = await client.get("/api/jobs/recommendations?location=Bengaluru&limit=5", headers=h)
    assert r.status_code == 200
    out = r.json()
    assert out["unlocked"] is True and out["role"] == "Backend Developer" and out["completion"]["percent"] == 100
    assert out["jobs"][0]["url"] == "https://x.test/1" and out["attribution"]["text"] == "Jobs by Adzuna"
    assert {l["platform"] for l in out["searchLinks"]} >= {"LinkedIn", "Indeed", "Google Jobs", "Naukri"}
    assert seen["role"] == "Backend Developer" and seen["location"] == "Bengaluru" and seen["limit"] == 5
    assert (await client.get("/api/flow/state", headers=h)).json()["stage"] == "jobs"


async def test_slug_roadmap_needs_every_skill_not_just_touched_ones(client, monkeypatch):
    async def fake_find(*a, **k):
        return FAKE

    monkeypatch.setattr(jobs_routes, "find_jobs", fake_find)
    h, _ = await _ready(client)
    await complete_skills(client, "alice", "role_backend", SKILLS[:1])  # frontend creates slug rows lazily
    assert (await client.get("/api/jobs/recommendations?roadmap_id=role_backend", headers=h)).status_code == 409
    await complete_skills(client, "alice", "role_backend")
    assert (await client.get("/api/jobs/recommendations?roadmap_id=role_backend", headers=h)).status_code == 200


async def test_needs_saved_roadmap_and_valid_id(client):
    assert (await client.get("/api/jobs/recommendations", headers=as_user("nobody"))).status_code == 409
    h, _ = await _ready(client)
    assert (await client.get("/api/jobs/recommendations?roadmap_id=bad%20id", headers=h)).status_code == 400


async def test_other_users_progress_does_not_unlock(client):
    h1, rid1 = await _ready(client, "alice")
    h2, _ = await _ready(client, "bob")
    await complete_skills(client, "alice", rid1)
    assert (await client.get(f"/api/jobs/recommendations?roadmap_id={rid1}", headers=h2)).status_code == 409


async def test_without_adzuna_keys_still_returns_search_links(client, monkeypatch):
    monkeypatch.setattr(jobs_service, "setting", lambda name, default=None: default)
    h, rid = await _ready(client)
    await complete_skills(client, "alice", rid)
    out = (await client.get("/api/jobs/recommendations", headers=h)).json()
    assert out["source"] == "links_only" and out["jobs"] == [] and out["searchLinks"] and out["attribution"] is None

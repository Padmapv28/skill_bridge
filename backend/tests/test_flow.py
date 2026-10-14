import pytest

import app.database.db as dbmod
from tests.conftest import ATS, GAP, ROADMAP, analysis_body, as_user, simulate_upload

pytestmark = pytest.mark.asyncio


async def test_requires_auth(client):
    assert (await client.get("/api/flow/state")).status_code == 401
    assert (await client.put("/api/flow/target-role", json="x")).status_code == 401


async def test_role_first_then_upload_keeps_role(client):
    h = as_user()
    st = (await client.get("/api/flow/state", headers=h)).json()
    assert st["stage"] == "choose_role" and st["hasResume"] is False

    body = (await client.put("/api/flow/target-role", headers=h, json={"role": "Backend Developer"})).json()
    assert body["stage"] == "upload_resume" and body["targetRole"] == "Backend Developer" and body["changed"] is False

    await simulate_upload()
    st = (await client.get("/api/flow/state", headers=h)).json()
    assert st["stage"] == "analysis" and st["targetRole"] == "Backend Developer" and st["hasResume"] is True
    # the existing upload still clears selected_role (existing behaviour untouched)
    assert (await client.get("/api/session/current", headers=h)).json()["selected_role"] is None


async def test_role_accepts_string_and_object_and_rejects_empty(client):
    h = as_user()
    assert (await client.put("/api/flow/target-role", headers=h, json="Data Scientist")).json()["targetRole"] == "Data Scientist"
    r = await client.put("/api/flow/target-role", headers=h, json={"id": "role_ml", "title": "ML Engineer"})
    assert r.json()["targetRole"] == "ML Engineer"
    assert (await client.put("/api/flow/target-role", headers=h, json={"id": "x"})).status_code == 400
    assert (await client.put("/api/flow/target-role", headers=h, json="  ")).status_code == 400


async def test_analysis_needs_resume_and_role(client):
    h = as_user()
    assert (await client.post("/api/flow/analysis", headers=h, json=analysis_body())).status_code == 409
    await simulate_upload()
    r = await client.post("/api/flow/analysis", headers=h, json=analysis_body())
    assert r.status_code == 409 and "role" in r.json()["detail"].lower()


async def test_analysis_saves_everything_and_existing_routes_can_read_it(client):
    h = as_user()
    await client.put("/api/flow/target-role", headers=h, json={"role": "Backend Developer"})
    await simulate_upload()
    r = await client.post("/api/flow/analysis", headers=h, json=analysis_body(jobDescription="x" * 500))
    assert r.status_code == 200
    out = r.json()
    assert out["stage"] == "roadmap" and out["totalSkills"] == 5 and len(out["roadmapId"]) == 24

    # your real GET /session/current (SessionResponse: selected_role must be a string)
    cur = (await client.get("/api/session/current", headers=h)).json()
    assert cur["selected_role"] == "Backend Developer" and cur["roadmap_id"] == out["roadmapId"]
    assert cur["roadmap"]["phases"][0]["skills"] == ["Python", "Git"] and cur["skill_gap"] == GAP

    # your real progress routes see the seeded rows
    s = (await client.get(f"/api/progress/{out['roadmapId']}/summary", headers=h)).json()
    assert s["total"] == 5 and s["completed"] == 0

    st = (await client.get("/api/flow/state", headers=h)).json()
    assert st["atsResult"] == ATS and st["stage"] == "roadmap" and st["completion"]["total"] == 5

    hist = await dbmod.db.ats_history.find({"user_id": "alice"}).to_list(length=None)
    assert len(hist) == 1 and hist[0]["role"] == "Backend Developer" and len(hist[0]["jd_snippet"]) == 300


async def test_analysis_validation(client):
    h = as_user()
    await client.put("/api/flow/target-role", headers=h, json="R")
    await simulate_upload()
    assert (await client.post("/api/flow/analysis", headers=h, json=analysis_body(roadmapResult={"role": "x"}))).status_code == 400
    assert (await client.post("/api/flow/analysis", headers=h, json={"atsResult": ATS})).status_code == 422
    assert (await client.post("/api/flow/analysis", headers=h, json=analysis_body(skillGapResult=None))).status_code == 422
    assert await dbmod.db.roadmap_progress.count_documents({}) == 0


async def test_changing_role_clears_results_but_keeps_resume(client):
    h = as_user()
    await client.put("/api/flow/target-role", headers=h, json="Backend Developer")
    await simulate_upload()
    await client.post("/api/flow/analysis", headers=h, json=analysis_body())

    same = (await client.put("/api/flow/target-role", headers=h, json="backend developer")).json()
    assert same["changed"] is False and same["roadmapResult"] is not None

    r = (await client.put("/api/flow/target-role", headers=h, json="Data Scientist")).json()
    assert r["changed"] is True and r["stage"] == "analysis" and r["hasResume"] is True
    assert r["atsResult"] is None and r["roadmapResult"] is None and r["roadmapId"] is None
    cur = (await client.get("/api/session/current", headers=h)).json()
    assert cur["selected_role"] == "Data Scientist" and cur["resume"] is not None and cur["roadmap"] is None


async def test_new_upload_hides_old_ats_but_keeps_target_role(client):
    h = as_user()
    await client.put("/api/flow/target-role", headers=h, json="Backend Developer")
    await simulate_upload()
    await client.post("/api/flow/analysis", headers=h, json=analysis_body())
    await simulate_upload(filename="new.pdf")
    st = (await client.get("/api/flow/state", headers=h)).json()
    assert st["atsResult"] is None and st["roadmapResult"] is None and st["stage"] == "analysis"
    assert st["targetRole"] == "Backend Developer"


async def test_users_are_isolated(client):
    await client.put("/api/flow/target-role", headers=as_user("alice"), json="Backend Developer")
    st = (await client.get("/api/flow/state", headers=as_user("bob"))).json()
    assert st["stage"] == "choose_role" and st["targetRole"] is None


async def test_old_flow_session_still_understood(client):
    """A user who went through the existing flow (selected_role only, no target_role)."""
    h = as_user()
    await simulate_upload()
    assert (await client.patch("/api/session/role", headers=h, json={"role": "Backend Developer"})).status_code == 200
    assert (await client.patch("/api/session/roadmap", headers=h, json={"roadmap": ROADMAP})).status_code == 200
    st = (await client.get("/api/flow/state", headers=h)).json()
    assert st["targetRole"] == "Backend Developer" and st["stage"] == "roadmap" and st["completion"]["total"] == 5

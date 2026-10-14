"""Pure-logic tests (no database / web server needed)."""
import asyncio
from datetime import datetime, timedelta, timezone

from app.services import jobs as jobs_service
from app.services.completion import build_progress_docs, compute_completion, expected_skills
from app.utils.roles import role_title, same_role, session_role

ROADMAP = {"phases": [{"phase": 1, "skills": ["Python", "Git"]}, {"phase": 2, "skills": [{"name": "FastAPI"}, "Docker"]}]}
ADZUNA = {
    "count": 42,
    "results": [
        {"title": "Senior <strong>Backend</strong> Developer", "company": {"display_name": "Acme"},
         "location": {"display_name": "Bengaluru, Karnataka"}, "redirect_url": "https://www.adzuna.in/jobs/land/ad/1",
         "created": "2026-10-10T08:00:00Z", "salary_min": 800000, "salary_max": 1200000, "contract_time": "full_time",
         "description": "Build <b>APIs</b> &amp; services"},
        {"title": "No link job", "redirect_url": None},
        "garbage",
    ],
}


def test_role_title_variants():
    assert role_title("  Backend   Developer ") == "Backend Developer"
    assert role_title({"role": "Data Scientist"}) == "Data Scientist"
    assert role_title({"id": "r1", "title": "Backend"}) == "Backend"
    assert role_title({"role": {"title": "ML Engineer"}}) == "ML Engineer"
    assert role_title(None) == "" and role_title({"id": "x"}) == "" and role_title(5) == ""


def test_same_role_ignores_case_and_punctuation():
    assert same_role("Backend Developer", "backend-developer")
    assert not same_role("Backend Developer", "Data Scientist")
    assert not same_role("", "")


def test_search_links():
    links = {l["platform"]: l["url"] for l in jobs_service.build_search_links("Backend Developer", "Bengaluru", "in")}
    assert links["Naukri"] == "https://www.naukri.com/backend-developer-jobs-in-bengaluru"
    assert links["LinkedIn"] == "https://www.linkedin.com/jobs/search/?keywords=Backend+Developer&location=Bengaluru"
    assert links["Indeed"] == "https://in.indeed.com/jobs?q=Backend+Developer&l=Bengaluru"
    assert "ibp=htl;jobs" in links["Google Jobs"]
    us = {l["platform"] for l in jobs_service.build_search_links("C++ Developer", "", "us")}
    assert "Naukri" not in us
    assert "C%2B%2B" in jobs_service.build_search_links("C++ Developer", "", "us")[0]["url"]
    assert jobs_service.build_search_links("Backend Developer", "", "in")[1]["url"] == "https://www.naukri.com/backend-developer-jobs"


def test_parse_adzuna_cleans_and_skips_bad_rows():
    jobs = jobs_service.parse_adzuna(ADZUNA)
    assert len(jobs) == 1
    j = jobs[0]
    assert j["title"] == "Senior Backend Developer" and j["company"] == "Acme"
    assert j["url"] == "https://www.adzuna.in/jobs/land/ad/1" and j["snippet"] == "Build APIs & services"
    assert j["employmentType"] == "full_time" and j["source"] == "Adzuna"
    assert jobs_service.parse_adzuna(None) == [] and jobs_service.parse_adzuna({"results": None}) == []


def test_expected_skills_and_completion():
    exp = expected_skills(ROADMAP)
    assert [(n, names[0]) for n, names in exp] == [(1, "Python"), (1, "Git"), (2, "FastAPI"), (2, "Docker")]
    done = {(1, "Python")}
    assert compute_completion(exp, done) == {"total": 4, "completed": 1, "percent": 25, "complete": False}
    everything = {(n, names[0]) for n, names in exp}
    assert compute_completion(exp, everything)["complete"] is True
    # rows outside the roadmap never unlock it; an empty roadmap never completes
    assert compute_completion(exp, {(9, "X")})["complete"] is False
    assert compute_completion([], {(1, "A")})["complete"] is False


def test_phase_numbers_follow_session_py_rules():
    rm = {"phases": [{"skills": ["A"]}, {"phase_number": "5", "skills": ["B"]}, {"phase": "x", "skills": ["C"]}]}
    assert [(n, names[0]) for n, names in expected_skills(rm)] == [(1, "A"), (5, "B"), (3, "C")]


def test_object_skills_match_either_name_or_str_form():
    rm = {"phases": [{"phase": 1, "skills": [{"name": "FastAPI", "level": 2}]}]}
    exp = expected_skills(rm)
    assert exp[0][1][0] == "FastAPI"
    assert compute_completion(exp, {(1, "FastAPI")})["complete"] is True      # frontend marks by name
    assert compute_completion(exp, {(1, str(rm["phases"][0]["skills"][0]))})["complete"] is True  # session.py's str(skill)


def test_build_progress_docs_matches_session_py_shape():
    docs = build_progress_docs("u1", "rid", ROADMAP, "now")
    assert len(docs) == 4 and set(docs[0]) == {
        "user_id", "roadmap_id", "phase_number", "skill_name", "status", "completed_at", "updated_at"}
    assert docs[0]["status"] == "not_started" and docs[0]["completed_at"] is None


def test_session_role_prefers_selected_then_target():
    assert session_role({"selected_role": "B", "target_role": "A"}) == "B"
    assert session_role({"selected_role": None, "target_role": "A"}) == "A"
    assert session_role({}) == "" and session_role(None) == ""


class _FakeCache:
    def __init__(self):
        self.docs = {}

    async def create_index(self, *a, **k):
        return None

    async def find_one(self, flt):
        return self.docs.get(flt["key"])

    async def update_one(self, flt, update, upsert=False):
        self.docs[flt["key"]] = dict(update["$set"])


class _FakeDb:
    def __init__(self):
        self.jobs_cache = _FakeCache()


def _settings(monkeypatch, **values):
    monkeypatch.setattr(jobs_service, "setting", lambda name, default=None: values.get(name, default))
    monkeypatch.setattr(jobs_service, "setting_int", lambda name, default: int(values.get(name, default)))


def test_find_jobs_without_credentials_is_links_only(monkeypatch):
    _settings(monkeypatch)
    out = asyncio.run(jobs_service.find_jobs(_FakeDb(), "Backend Developer", "", "in", 1, 10))
    assert out["source"] == "links_only" and out["jobs"] == [] and out["note"]


def test_find_jobs_fetches_then_caches(monkeypatch):
    _settings(monkeypatch, ADZUNA_APP_ID="id", ADZUNA_APP_KEY="key")
    calls = []

    async def fake_get(url, params):
        calls.append((url, params))
        return ADZUNA

    monkeypatch.setattr(jobs_service, "_http_get_json", fake_get)
    db = _FakeDb()
    first = asyncio.run(jobs_service.find_jobs(db, "Backend Developer", "Bengaluru", "in", 1, 10))
    second = asyncio.run(jobs_service.find_jobs(db, "Backend Developer", "Bengaluru", "in", 1, 10))
    assert first["source"] == "adzuna" and first["total"] == 42 and len(first["jobs"]) == 1
    assert second == first and len(calls) == 1
    url, params = calls[0]
    assert url == "https://api.adzuna.com/v1/api/jobs/in/search/1"
    assert params["what"] == "Backend Developer" and params["where"] == "Bengaluru" and params["results_per_page"] == 10
    # expired cache entry triggers a refetch
    for doc in db.jobs_cache.docs.values():
        doc["expires_at"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    asyncio.run(jobs_service.find_jobs(db, "Backend Developer", "Bengaluru", "in", 1, 10))
    assert len(calls) == 2


def test_provider_failure_degrades_to_links_and_is_not_cached(monkeypatch):
    _settings(monkeypatch, ADZUNA_APP_ID="id", ADZUNA_APP_KEY="key")

    async def boom(url, params):
        raise RuntimeError("https://api.adzuna.com/...app_key=SECRET")

    monkeypatch.setattr(jobs_service, "_http_get_json", boom)
    db = _FakeDb()
    out = asyncio.run(jobs_service.find_jobs(db, "Backend Developer", "", "in", 1, 10))
    assert out["source"] == "links_only" and out["note"] == jobs_service.UNAVAILABLE_NOTE
    assert db.jobs_cache.docs == {}

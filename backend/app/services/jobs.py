"""Live job openings for a role (Adzuna) + always-available search deep links.

* Live listings need free Adzuna credentials: ADZUNA_APP_ID / ADZUNA_APP_KEY.
  Without them (or if Adzuna is down) the endpoint still works and returns search links only.
* Adzuna terms: send users through `redirect_url` as-is and show "Jobs by Adzuna".
* Results are cached in Mongo (jobs_cache, TTL) because the free tier has a monthly call limit.
"""
import hashlib
import html
import logging
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus

from app.utils.env import setting, setting_int

logger = logging.getLogger(__name__)

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"
_TAG_RE = re.compile(r"<[^>]+>")
_INDEED_HOSTS = {
    "in": "in.indeed.com", "us": "www.indeed.com", "gb": "uk.indeed.com",
    "ca": "ca.indeed.com", "au": "au.indeed.com", "sg": "sg.indeed.com",
}
LINKS_ONLY_NOTE = "Live job listings are not configured on this server. Use the search links below."
UNAVAILABLE_NOTE = "Live listings are temporarily unavailable. Use the search links below."


class JobsProviderError(Exception):
    pass


_indexes_ready = False


async def _ensure_cache_indexes(db) -> None:
    """Create the jobs_cache indexes once per process (idempotent), so indexes.py needs no edit."""
    global _indexes_ready
    if _indexes_ready:
        return
    _indexes_ready = True
    try:
        await db.jobs_cache.create_index("key", unique=True)
        await db.jobs_cache.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        logger.warning("Could not create jobs_cache indexes", exc_info=True)


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _clean(text) -> str:
    return " ".join(html.unescape(_TAG_RE.sub("", text or "")).split())


def build_search_links(role: str, location: str, country: str) -> list:
    """Search-results pages on the big job sites for this role. These are searches, not single openings."""
    q = quote_plus(role)
    loc = quote_plus(location) if location else ""
    links = [
        {"platform": "LinkedIn", "type": "search",
         "url": f"https://www.linkedin.com/jobs/search/?keywords={q}" + (f"&location={loc}" if loc else "")},
        {"platform": "Indeed", "type": "search",
         "url": f"https://{_INDEED_HOSTS.get(country, 'www.indeed.com')}/jobs?q={q}" + (f"&l={loc}" if loc else "")},
        {"platform": "Google Jobs", "type": "search",
         "url": "https://www.google.com/search?q="
                + quote_plus(f"{role} jobs" + (f" in {location}" if location else "")) + "&ibp=htl;jobs"},
    ]
    if country == "in":
        slug, loc_slug = _slug(role), _slug(location)
        links.insert(1, {"platform": "Naukri", "type": "search",
                         "url": f"https://www.naukri.com/{slug}-jobs" + (f"-in-{loc_slug}" if loc_slug else "")})
    return links


def parse_adzuna(payload) -> list:
    if not isinstance(payload, dict):
        return []
    jobs = []
    for r in payload.get("results") or []:
        if not isinstance(r, dict):
            continue
        url = r.get("redirect_url")
        if not isinstance(url, str) or not url.startswith(("http://", "https://")):
            continue
        jobs.append({
            "title": _clean(r.get("title")),
            "company": (r.get("company") or {}).get("display_name"),
            "location": (r.get("location") or {}).get("display_name"),
            "url": url,
            "postedAt": r.get("created"),
            "salaryMin": r.get("salary_min"),
            "salaryMax": r.get("salary_max"),
            "employmentType": r.get("contract_time") or r.get("contract_type"),
            "snippet": _clean(r.get("description"))[:300],
            "source": "Adzuna",
        })
    return jobs


async def _http_get_json(url: str, params: dict):
    import httpx  # imported lazily so the rest of the app never depends on it at import time

    timeout = float(setting_int("JOBS_TIMEOUT_SECONDS", 8))
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url, params=params, headers={"Accept": "application/json"})
        resp.raise_for_status()
        return resp.json()


async def fetch_adzuna(role: str, location: str, country: str, page: int, limit: int) -> dict:
    params = {
        "app_id": setting("ADZUNA_APP_ID"), "app_key": setting("ADZUNA_APP_KEY"),
        "what": role, "results_per_page": limit, "content-type": "application/json",
    }
    if location:
        params["where"] = location
    try:
        return await _http_get_json(f"{ADZUNA_BASE}/{country}/search/{page}", params)
    except Exception as exc:
        # Never log str(exc): httpx puts the full URL (including app_key) in the message.
        status = getattr(getattr(exc, "response", None), "status_code", None)
        logger.warning("Adzuna request failed: %s (status=%s)", type(exc).__name__, status)
        raise JobsProviderError() from None


async def find_jobs(db, role: str, location: str, country: str, page: int, limit: int) -> dict:
    """Returns {jobs, source, total, note}. Never raises for provider problems."""
    if not (setting("ADZUNA_APP_ID") and setting("ADZUNA_APP_KEY")):
        return {"jobs": [], "source": "links_only", "total": 0, "note": LINKS_ONLY_NOTE}

    await _ensure_cache_indexes(db)
    key = hashlib.sha256(f"adzuna|{country}|{role.lower()}|{location.lower()}|{page}|{limit}".encode()).hexdigest()
    now = datetime.now(timezone.utc)
    cached = await db.jobs_cache.find_one({"key": key})
    if cached and _aware(cached["expires_at"]) > now:
        return cached["payload"]

    try:
        payload = await fetch_adzuna(role, location, country, page, limit)
    except JobsProviderError:
        return {"jobs": [], "source": "links_only", "total": 0, "note": UNAVAILABLE_NOTE}

    jobs = parse_adzuna(payload)
    count = payload.get("count") if isinstance(payload, dict) else None
    result = {
        "jobs": jobs, "source": "adzuna", "total": count if isinstance(count, int) else len(jobs),
        "note": None if jobs else "No live listings matched right now. Try the search links below.",
    }
    ttl = setting_int("JOBS_CACHE_TTL_SECONDS", 1800)
    await db.jobs_cache.update_one(
        {"key": key},
        {"$set": {"key": key, "payload": result, "expires_at": now + timedelta(seconds=ttl)}},
        upsert=True,
    )
    return result

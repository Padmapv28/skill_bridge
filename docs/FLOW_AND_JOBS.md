# Role-first flow + job openings (added feature)

Journey: **choose role -> upload resume -> ATS + skill gap + roadmap for that role -> mark skills complete -> job openings**.
All endpoints are NEW. No existing route, model or collection shape was changed.

## 1. The only edits to existing files: `backend/main.py` (3 additions)
```python
# next to your other `from app.routes import ...`
from app.routes import flow, jobs, ops

# after the ats_history include_router block, before the ROOT ENDPOINT
app.include_router(flow.router, prefix="/api", tags=["flow"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])
app.include_router(ops.router, tags=["ops"])          # /healthz and /readyz (no /api prefix)
```
Install the extra packages: `pip install -r requirements.extra.txt` (httpx, gunicorn).

## 2. Endpoints (all under `/api`, all need the normal `Authorization: Bearer <token>`)

### PUT /flow/target-role   (works before any resume exists)
Body: `"Backend Developer"` or `{ "id": "role_backend", "title": "Backend Developer" }` (also `role` / `name` / `label`).
Returns the same object as `GET /flow/state` plus `"changed": true|false`.
- A DIFFERENT role clears `ats_result`, `skill_gap`, `roadmap`, `roadmap_id` (same rule as `PATCH /session/role`); the resume is kept.
- The same role again changes nothing. The role survives `POST /upload-resume`.
- If a resume exists it also sets `selected_role` (a string, as your `SessionResponse` expects).
Errors: 400 empty/too-long role | 401

### POST /flow/analysis   (after the upload)
Body `{ "atsResult": {...}, "skillGapResult": {...}, "roadmapResult": { "phases": [ { "phase": 1, "skills": [...] } ] }, "jobDescription": "", "label": "optional" }`
Saves all three for the target role, creates the progress rows (same shape `PATCH /session/roadmap` creates), writes one ATS-history entry.
200 `{ "success": true, "stage": "roadmap", "role": "...", "roadmapId": "<24-hex>", "totalSkills": 5 }`
Errors: 409 no resume | 409 no target role | 400 roadmap without `phases` | 422 invalid body | 401

### GET /flow/state?roadmap_id=<optional>
`{ success, stage, targetRole, hasResume, resume, atsResult, skillGapResult, roadmapResult, roadmapId, completion:{total,completed,percent,complete}|null, jobsUnlocked, updated_at }`
`stage`: `choose_role | upload_resume | analysis | roadmap | jobs`. Users created by the existing flow work too.
An ATS result is only returned while it belongs to the current resume (a new upload hides the old score).

### GET /jobs/recommendations?roadmap_id=&location=&country=&page=1&limit=10
Locked (409 "N of M skills done") until every skill in the saved roadmap is `completed`.
200 `{ success, unlocked, role, location, country, page, completion, source:"adzuna"|"links_only", total, jobs:[{title,company,location,url,postedAt,salaryMin,salaryMax,employmentType,snippet,source}], searchLinks:[{platform,type:"search",url}], note, attribution:{text,url}|null }`
- `jobs[].url` is Adzuna's `redirect_url` (opens the real posting through Adzuna). Show "Jobs by Adzuna" when `attribution` is set.
- `searchLinks` = LinkedIn / Naukri (India) / Indeed / Google Jobs result pages for the role. They are searches, not single openings.
- No Adzuna keys, or Adzuna down: still 200 with `source:"links_only"`, `jobs:[]` and a `note`.

### GET /healthz , GET /readyz   (no /api prefix, no auth)
Liveness, and readiness (503 if MongoDB does not answer).

## 3. What the FRONTEND must do (the backend cannot reorder pages)
1. After the user searches/picks a role: `PUT /api/flow/target-role`, then go to the upload page.
2. After upload: run your existing ATS / skill-gap / roadmap calls for that role, then save with ONE call: `POST /api/flow/analysis`.
3. Track completion with the existing `/api/progress/{roadmapId}/skill`, **using the `roadmapId` returned by `/flow/analysis`**.
   (Slug ids like `role_ai_app_eng` are shared by every user: the unique index and ownership check in progress.py
   treat them as one roadmap, so a second user gets 403. Server ids avoid that.)
4. When `GET /api/flow/state` shows `stage: "jobs"` (or `jobsUnlocked: true`), show the Jobs page from `GET /api/jobs/recommendations`.
5. On page load call `GET /api/flow/state` and route by `stage`.

## 4. Tests
`pip install -r requirements.extra-dev.txt` then `pytest` from `backend/`. They use an in-memory MongoDB and bypass login with an
`X-Test-User` header, but mount your REAL `session.py` and `progress.py` routers.

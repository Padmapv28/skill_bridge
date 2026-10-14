# Deploying the SkillBridge backend

## What you need
1. **MongoDB**: MongoDB Atlas free cluster. Create a DB user; in Network Access allow your host's IPs (0.0.0.0/0 while testing).
2. **A host that runs Docker** (Render, Railway, Fly.io, a VPS). `backend/Dockerfile` runs `gunicorn main:app` with uvicorn workers,
   listens on `$PORT`, runs as a non-root user. If your app object is not `main:app`, set `APP_MODULE`.
3. Your frontend's public URL in your existing CORS setting in `main.py`.

## Environment variables (set on the host, never commit `.env`)
Your existing ones (Mongo URL, `JWT_SECRET_KEY`, SMTP, `ENVIRONMENT=production`, frontend URL, Ollama settings...) plus the new,
optional job-openings ones from `backend/.env.additions.example`:
`ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `JOBS_COUNTRY`, `JOBS_DEFAULT_LOCATION`, `JOBS_CACHE_TTL_SECONDS`, `JOBS_TIMEOUT_SECONDS`.
Optional: `WEB_CONCURRENCY` (default 1), `GUNICORN_TIMEOUT` (default 120 s), `APP_MODULE`.

## Steps
1. Add the 3 router lines to `main.py` (see `docs/FLOW_AND_JOBS.md`).
2. Local check: `cd backend; docker build -t skillbridge-api .; docker run --env-file .env -p 8000:8000 skillbridge-api`, then open `http://localhost:8000/docs`.
3. Push to GitHub, create the service from `backend/Dockerfile` (root directory `backend`), add the env vars.
4. Health check path: `/healthz` (process) or `/readyz` (process + MongoDB).
5. Point the frontend API base URL at the deployed backend.

## Things that commonly break a first deploy
- **The LLM (Ollama)**: `main.py` warms up Ollama at startup. A local Ollama model does not exist on a small PaaS instance. Run Ollama on a VM with enough
  RAM/GPU and point your Ollama URL setting at it, or switch those calls to a hosted model API.
- **Outbound SMTP**: some hosts block SMTP ports (587/465) on free plans, so OTP emails fail. Check your host's policy; otherwise use a paid plan or an HTTP email API.
- **Model/data files** (`app/data`, `app/services/data`, sentence-transformer weights) must be in the image or downloadable at startup; the first request can be slow.
- **Atlas IP allowlist**: connection timeouts at startup usually mean the host's IP is not allowed.
- **CORS**: a blocked browser request against a healthy backend usually means the frontend URL is missing or has a trailing slash.
- **Memory**: embedding models plus several workers can exceed a small instance; keep `WEB_CONCURRENCY=1` until you know your headroom.

## Job openings
- With Adzuna keys: real listings, cached 30 minutes (the free tier has a monthly call limit; check Adzuna's current limits and terms). Links go through Adzuna's `redirect_url`; show "Jobs by Adzuna".
- Without keys: the endpoint still works and returns LinkedIn / Naukri / Indeed / Google Jobs search links.

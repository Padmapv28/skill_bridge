# AI Career Role Predictor & Roadmap Generator — Backend

Backend API for a system that predicts suitable career roles from a
resume/skill set and generates a phased learning roadmap to close the
skill gap for a chosen role.

This service owns **authentication, data storage, resume management, and
a deterministic rule-based prediction/roadmap engine**. It does not
implement any frontend, and it does not use or claim to use an AI/ML
model — role prediction and roadmap generation are driven by a
configurable, editable skill-mapping table so a real ML/LLM model can be
plugged in later without changing the API surface.

---

## 1. Architecture

```
Client (frontend, not part of this repo)
        │  REST / JSON, JWT Bearer auth
        ▼
FastAPI app (app/main.py)
   ├── routes/      → HTTP layer: request parsing, status codes, auth deps
   ├── schemas/      → Pydantic request/response models & validation
   ├── services/     → Business logic (auth, resumes, predictions, roadmaps)
   ├── models/       → Shape/helpers for MongoDB documents
   ├── database/      → MongoDB connection management
   └── utils/         → Password hashing, JWT, ObjectId/serialization helpers
        │
        ▼
MongoDB (career_predictor)
   ├── users
   ├── resumes
   ├── predictions
   └── roadmaps
```

Each layer only talks to the layer directly below it: routes call
services, services call the database. Nothing but `database/mongodb.py`
talks to MongoDB directly.

### Prediction & roadmap logic

`app/services/prediction_service.py` defines `ROLE_SKILL_MAP`, a plain
Python dict mapping each career role to its required skills. Predictions
score every role by how many required skills the user already has.
`app/services/roadmap_service.py` defines `SKILL_TOPIC_MAP`, which groups
individual skills into learning phases. Both are intentionally simple,
config-style data structures — edit them directly to add roles/skills, or
replace the functions that use them with real ML/LLM calls later; the
function signatures other code depends on won't need to change.

---

## 2. Requirements

- Python 3.11+
- MongoDB (local install or a hosted instance, e.g. MongoDB Atlas)

## 3. Setup

```bash
cd backend

# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# then edit .env — at minimum, set a real JWT_SECRET_KEY
```

### MongoDB setup

Run MongoDB locally (e.g. `mongod` from the MongoDB Community Server, or
via Docker: `docker run -d -p 27017:27017 mongo`), or point `MONGODB_URL`
in `.env` at a hosted cluster (e.g. MongoDB Atlas connection string). The
database (`career_predictor`) and its collections (`users`, `resumes`,
`predictions`, `roadmaps`) are created automatically on first write —
no manual schema setup is required.

The app **will start even if MongoDB is unreachable**; endpoints that
need the database return `503 Service Unavailable` until it's back, and
`GET /api/health/database` reports connection status.

### Environment variables

| Variable                      | Description                                   | Example                         |
|--------------------------------|------------------------------------------------|----------------------------------|
| `MONGODB_URL`                  | MongoDB connection string                     | `mongodb://localhost:27017`     |
| `DATABASE_NAME`                | Database name                                 | `career_predictor`              |
| `JWT_SECRET_KEY`               | Secret used to sign JWTs — **change this**    | (random long string)            |
| `JWT_ALGORITHM`                | JWT signing algorithm                         | `HS256`                         |
| `ACCESS_TOKEN_EXPIRE_MINUTES`  | Access token lifetime, in minutes             | `60`                             |

## 4. Running the backend

```bash
uvicorn app.main:app --reload
```

The API is then available at `http://localhost:8000`, with interactive
Swagger docs at `http://localhost:8000/docs` (and ReDoc at `/redoc`).
Protected endpoints show a padlock icon in Swagger — click **Authorize**
and paste a JWT obtained from `POST /api/auth/login` to test them
in-browser.

## 5. Running tests

```bash
pytest
```

or with more detail:

```bash
pytest -v
```

Tests use [`mongomock`](https://github.com/mongomock/mongomock) as a
drop-in in-memory MongoDB replacement (via a FastAPI dependency
override), so they run fully isolated and **never require a real
MongoDB connection or your real credentials**.

> **Note on this delivery:** the sandbox used to generate this backend
> had no outbound network access, so dependencies could not be installed
> and `pytest`/`uvicorn` could not be executed here. Every file was
> syntax- and AST-checked, and the code was carefully reviewed end-to-end
> for correctness, but please run `pip install -r requirements.txt` and
> `pytest` yourself as the final verification step. See "Remaining
> limitations" below.

## 6. Project structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, middleware, router registration
│   ├── config.py                # Environment-variable-based settings
│   ├── database/
│   │   └── mongodb.py           # Connection lifecycle + get_db() dependency
│   ├── models/                  # MongoDB document shape helpers
│   │   ├── user.py
│   │   ├── resume.py
│   │   ├── prediction.py
│   │   └── roadmap.py
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── resume.py
│   │   ├── prediction.py
│   │   └── roadmap.py
│   ├── routes/                  # HTTP endpoints
│   │   ├── health.py
│   │   ├── auth.py
│   │   ├── resumes.py
│   │   ├── predictions.py
│   │   └── roadmaps.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── resume_service.py
│   │   ├── prediction_service.py
│   │   └── roadmap_service.py
│   └── utils/
│       ├── security.py          # Password hashing, JWT
│       └── helpers.py           # ObjectId validation, doc serialization
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_resumes.py
│   ├── test_predictions.py
│   └── test_roadmaps.py
├── .env                         # Local secrets (git-ignored)
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## 7. API endpoints

All request/response bodies, status codes, and auth requirements are
documented interactively at `/docs`. Summary:

| Method | Path                          | Auth | Description                              |
|--------|-------------------------------|------|-------------------------------------------|
| GET    | `/`                           | No   | Root health check                        |
| GET    | `/api/health`                 | No   | API health check                         |
| GET    | `/api/health/database`        | No   | MongoDB connection status                |
| POST   | `/api/auth/register`          | No   | Register a new user                      |
| POST   | `/api/auth/login`             | No   | Log in, receive a JWT                    |
| GET    | `/api/auth/me`                | Yes  | Get the authenticated user's profile     |
| POST   | `/api/resumes`                | Yes  | Create a resume                          |
| GET    | `/api/resumes`                | Yes  | List the user's resumes                  |
| GET    | `/api/resumes/{resume_id}`    | Yes  | Get a specific resume                    |
| PUT    | `/api/resumes/{resume_id}`    | Yes  | Update a resume                          |
| DELETE | `/api/resumes/{resume_id}`    | Yes  | Delete a resume                          |
| POST   | `/api/analyze-resume`         | Yes  | Normalize resume/skill data              |
| POST   | `/api/predictions`            | Yes  | Predict career roles (rule-based)        |
| POST   | `/api/predictions/skill-gap`  | Yes  | Skill gap analysis for a role            |
| GET    | `/api/predictions`            | Yes  | List the user's prediction history       |
| GET    | `/api/predictions/{id}`       | Yes  | Get a specific prediction                |
| POST   | `/api/roadmaps`                | Yes  | Generate a learning roadmap              |
| GET    | `/api/roadmaps`                | Yes  | List the user's roadmaps                 |
| GET    | `/api/roadmaps/{roadmap_id}`   | Yes  | Get a specific roadmap                   |
| DELETE | `/api/roadmaps/{roadmap_id}`   | Yes  | Delete a roadmap                         |

Protected routes require `Authorization: Bearer <access_token>`. Resumes,
predictions, and roadmaps are always scoped to the authenticated user —
attempting to access another user's record returns `403 Forbidden`.

## 8. Example requests

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Varsha", "email": "varsha@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "varsha@example.com", "password": "password123"}'
# -> { "access_token": "...", "token_type": "bearer" }

TOKEN="<paste access_token here>"

# Create a resume
curl -X POST http://localhost:8000/api/resumes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
        "name": "Varsha", "email": "varsha@example.com",
        "education": [{"degree": "B.E", "branch": "Computer Science", "college": "SJCIT", "year": 2026}],
        "skills": ["Python", "SQL", "Pandas", "FastAPI"],
        "projects": [{"title": "AI Career Predictor", "description": "Career prediction system"}],
        "experience": [], "certifications": []
      }'

# Predict career roles from those skills
curl -X POST http://localhost:8000/api/predictions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"skills": ["Python", "SQL", "Pandas", "FastAPI"]}'

# Generate a roadmap for a role
curl -X POST http://localhost:8000/api/roadmaps \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"role": "Data Analyst", "missing_skills": ["Power BI", "Excel"]}'
```

## 9. Security notes

- Passwords are hashed with **bcrypt** and never stored or returned in
  plain text.
- Authentication uses signed **JWT** bearer tokens (`PyJWT`).
- Every resume/prediction/roadmap route checks that the record belongs
  to the requesting user before returning or mutating it.
- `.env` is git-ignored; only `.env.example` (with placeholder values)
  is committed.
- The generic exception handler in `main.py` never returns stack traces
  to the client.

## 10. Remaining limitations

- **Not run in this environment**: the sandbox that produced this code
  had no outbound network access, so `pip install`, `uvicorn`, and
  `pytest` could not actually be executed here. Please run the setup and
  test commands above yourself as a final check; the code has been
  carefully reviewed and syntax/AST-validated, but hasn't been executed
  end-to-end.
- Career prediction and roadmap generation are **rule-based**, using an
  editable in-code skill mapping (`ROLE_SKILL_MAP`, `SKILL_TOPIC_MAP` in
  `app/services/`) — not a trained ML model or LLM. The service functions
  are structured so a real model can replace the internals later.
- No rate limiting, refresh tokens, email verification, or password
  reset flow are implemented — add these before production use.
- `allow_origins=["*"]` in CORS is for local development only; restrict
  it before deploying.

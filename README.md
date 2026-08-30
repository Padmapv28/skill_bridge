# SkillBridge - AI-Powered Resume Analyzer and Career Roadmap Generator using LLM

An AI-powered resume analysis platform: upload a resume, get predicted career roles, a skill gap analysis against a chosen role, and a personalized learning roadmap - all grounded in your actual resume data via a locally-hosted LLM (Ollama).

## Table of Contents
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Overview](#api-overview)
- [Team & Contributions](#team--contributions)
- [Known Limitations](#known-limitations)
- [Status](#status)

## Architecture

```mermaid
```

**Flow summary:**
1. User registers/logs in (JWT authentication).
2. Resume (PDF/DOCX) is uploaded, parsed into structured JSON by the resume parser, and stored in MongoDB linked to the user.
3. The backend fetches that specific stored resume by ID and passes it into the AI services running on a local Ollama LLM instance.
4. Role prediction, skill gap analysis, and roadmap generation are all grounded in that real resume data - not a shared default.
5. Results are returned to the React frontend and displayed across dedicated pages.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend API | FastAPI (Python), JWT auth (python-jose), bcrypt |
| Database | MongoDB (Atlas, cloud-hosted) |
| AI / LLM | Ollama (llama3.2, run locally) |
| Resume Parsing | pdfplumber, PyMuPDF, pytesseract (OCR), spaCy (NER), rapidfuzz |
| Testing | Manual + Swagger UI (interactive API testing) |

## Project Structure

| Folder | Owner | Purpose |
|---|---|---|
| `ml/` | Member A | Resume parsing & data extraction - PDF/DOCX to structured JSON |
| `backend/` | Member B & C | FastAPI app: auth, resume storage, role prediction, skill gap, roadmap generation |
| `frontend/` | Member D | React UI |
| `docs/` | All | Technical methodology documentation |

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed locally, with the `llama3.2` model pulled (`ollama pull llama3.2`)
- A MongoDB connection string (MongoDB Atlas free tier, or a local MongoDB instance)

### 1. Clone the repository
```bash
git clone https://github.com/Padmapv28/skill_bridge.git
cd skill_bridge
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```
Create `backend/.env` from `backend/.env.example` and fill in your real MongoDB connection string and a JWT secret:
```bash
cp .env.example .env
```

Start Ollama (in its own terminal, if not already running):
```bash
ollama serve
```

Start the backend:
```bash
python -m uvicorn main:app --reload
```
Backend runs at `http://127.0.0.1:8000`. Interactive API docs: `http://127.0.0.1:8000/docs`.

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

### 4. Resume parser (ml module)
The resume parser is called internally by the backend when a resume is uploaded. To test it standalone:
```bash
cd ../ml/src
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python main.py <path_to_resume.pdf>
```

## API Overview

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/register` | POST | Create a new account |
| `/api/login` | POST | Authenticate, returns a JWT |
| `/api/me` | GET | Get the current user's profile |
| `/api/upload-resume` | POST | Upload and parse a resume |
| `/api/resumes/{id}` | GET | Fetch a stored resume |
| `/api/career/predict-roles` | GET | Predict roles for a resume (`resume_id` query param) |
| `/api/career/skill-gap` | GET | Skill gap analysis (`resume_id`, `role` query params) |
| `/api/career/roadmap` | GET | Generate a learning roadmap (`resume_id`, `role` query params) |

Full interactive documentation is available at `/docs` once the backend is running.

## Team & Contributions

| Member | Area | Key deliverables |
|---|---|---|
| **A** | Resume Parsing & Data Extraction | PDF/DOCX text extraction with OCR fallback, NLP-based structured parsing, 524-skill taxonomy matching, fuzzy section header detection, 26 sample resumes tested |
| **B** | LLM / ML Pipeline | Ollama integration, role prediction, skill gap analysis, roadmap generation, Pydantic-validated JSON output with retry logic for reliability |
| **C** | Backend, Database & Integration | FastAPI structure, JWT authentication, MongoDB schema and CRUD, orchestration connecting parsing to AI services |
| **D** | Frontend & UI/UX | React application: landing, auth, resume upload, results, skill gap, and roadmap pages |

## Known Limitations

- Severely irregular multi-column or infographic-style resumes may still interleave text from different columns during parsing.
- OCR accuracy depends on scan quality and degrades on unusual fonts or heavily stylized templates.
- Role prediction, skill gap, and roadmap generation are limited to roles present in the curated role-skills reference dataset.
- Being a small local model, `llama3.2` occasionally requires an internal retry to produce valid JSON output; this trades a little latency for reliability.
- No containerized one-command startup (Docker Compose) yet - the three services (backend, frontend, Ollama) are started manually per the setup instructions above.

## Status

- Resume parsing pipeline: complete and tested.
- LLM pipeline (role prediction, skill gap, roadmap): complete, tested with real resume data end-to-end.
- Backend (auth, CRUD, orchestration): complete.
- Frontend (all core pages): complete.
- Full integration testing across multiple real resumes and documentation review: in progress.

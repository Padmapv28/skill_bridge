# SkillBridge API Contract (Member C - Backend & Database Lead)

**Version:** 2.0.0  
**Target Audience:** Member D (Frontend Lead) & Integration Team  
**Base URL:** `http://localhost:8000/api` (All routes are prefixed with `/api`)

---

## 🚨 CRITICAL BREAKING CHANGE NOTICE for Member D

> ### `POST /api/register` No Longer Returns an Auth Token
> **Old behavior:** Registration immediately created the user in `db.users` and returned `{ token, user }`.  
> **New behavior:** Registration stages user details in `db.pending_registrations` and generates a 6-digit OTP dispatched to the user's email. It returns `{ message, email, expires_in_seconds }`.
> 
> **Action Required in Frontend:**
> 1. After submitting the registration form, redirect the user to an **OTP verification screen / modal**.
> 2. Submit the 6-digit code and email to `POST /api/verify-otp`.
> 3. `POST /api/verify-otp` returns the `{ token, user }` response payload identical to `POST /api/login`.
> 4. Use `POST /api/resend-otp` if the user needs a new OTP (has a 60-second cooldown).
> 5. Existing legacy users created before this update can continue logging in via `POST /api/login` without being blocked.

---

## 1. Authentication & OTP Verification

### 1.1 Register User & Send OTP
- **Endpoint:** `POST /api/register`
- **Auth:** None
- **Description:** Validates registration info, normalizes email, checks for duplicates, generates a 6-digit OTP, stores its HMAC-SHA256 hash in `pending_registrations` (valid for 10 minutes), and sends the OTP email (or logs it to the terminal if `OTP_DEV_MODE=True`).

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Response (200 OK)
```json
{
  "message": "Verification OTP sent to your email.",
  "email": "jane.doe@example.com",
  "expires_in_seconds": 600
}
```

#### Error Codes
- `400 Bad Request`: Password less than 8 characters or email already registered:
  ```json
  { "detail": "An account with this email already exists." }
  ```
- `502 Bad Gateway`: Email delivery failure (pending record is safely deleted).

---

### 1.2 Verify OTP & Activate Account
- **Endpoint:** `POST /api/verify-otp`
- **Auth:** None
- **Description:** Verifies the 6-digit OTP. On match, creates the user in `db.users` with `is_verified: true`, deletes the pending record, and returns the JWT token and user profile.

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "otp": "481920"
}
```

#### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67041a99f18a24c13a290fa1",
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }
}
```

#### Error Codes
- `400 Bad Request`: Invalid OTP (shows remaining attempts) or no pending registration:
  ```json
  { "detail": "Invalid OTP. 4 attempt(s) remaining." }
  ```
- `410 Gone`: OTP has expired (> 10 minutes):
  ```json
  { "detail": "OTP has expired. Please request a new one." }
  ```
- `429 Too Many Requests`: 5 failed attempts reached:
  ```json
  { "detail": "Too many failed attempts. Please request a new OTP." }
  ```

---

### 1.3 Resend Verification OTP
- **Endpoint:** `POST /api/resend-otp`
- **Auth:** None
- **Description:** Generates a fresh OTP, resets attempts to 0, extends expiration to 10 minutes, and emails the new OTP. Enforces a 60-second cooldown and a maximum of 5 resends.

#### Request Body
```json
{
  "email": "jane.doe@example.com"
}
```

#### Response (200 OK)
```json
{
  "message": "Verification OTP sent to your email.",
  "email": "jane.doe@example.com",
  "expires_in_seconds": 600
}
```

#### Error Codes
- `400 Bad Request`: No pending registration found for this email.
- `429 Too Many Requests`: Cooldown active or max resends exceeded:
  ```json
  { "detail": "Please wait 45 second(s) before requesting a new OTP." }
  ```

---

### 1.4 User Login
- **Endpoint:** `POST /api/login`
- **Auth:** None
- **Description:** Authenticates user via email and password. Legacy accounts without `is_verified` are treated as verified.

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67041a99f18a24c13a290fa1",
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }
}
```

---

### 1.5 Get Current User Profile
- **Endpoint:** `GET /api/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "id": "67041a99f18a24c13a290fa1",
  "name": "Jane Doe",
  "email": "jane.doe@example.com"
}
```

---

### 1.6 Logout
- **Endpoint:** `POST /api/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{ "success": true }
```

---

## 2. Resume Upload & Session Persistence

### 2.1 Authenticated Resume Upload
- **Endpoint:** `POST /api/upload-resume`
- **Auth:** `Bearer <token>`
- **Content-Type:** `multipart/form-data`
- **Form Field:** `resume` (Binary file: `.pdf` or `.docx`, max 5 MB)
- **Description:** Parses the uploaded resume, saves it to `db.resumes`, and upserts into `db.user_sessions`. **Crucial:** Uploading a new resume resets downstream session items (`predictions`, `selected_role`, `skill_gap`, `roadmap`, `roadmap_id` are set to `null`).

#### Response (200 OK)
```json
{
  "success": true,
  "resumeId": "67042013f18a24c13a290fa5",
  "filename": "JaneDoe_Resume.pdf",
  "parsedData": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "skills": ["Python", "FastAPI", "React", "Docker"],
    "experience": [...],
    "education": [...]
  },
  "predictions": []
}
```

---

### 2.2 Get Current Session State
- **Endpoint:** `GET /api/session/current`
- **Auth:** `Bearer <token>`
- **Description:** Returns the persisted pipeline state for the logged-in user. If no session exists, returns 200 with all fields as `null`.

#### Response (200 OK)
```json
{
  "user_id": "67041a99f18a24c13a290fa1",
  "resume": {
    "filename": "JaneDoe_Resume.pdf",
    "parsed_data": { ... },
    "uploaded_at": "2026-10-08T14:30:00Z"
  },
  "predictions": [ ... ],
  "selected_role": "Full Stack Engineer",
  "skill_gap": { ... },
  "roadmap": { ... },
  "roadmap_id": "670422c5f18a24c13a290fab",
  "updated_at": "2026-10-08T14:35:12Z"
}
```

---

### 2.3 Update Predictions
- **Endpoint:** `PATCH /api/session/predictions`
- **Auth:** `Bearer <token>`
- **Request Body:**
```json
{
  "predictions": [
    { "role": "Full Stack Engineer", "confidence": 0.88 },
    { "role": "Backend Engineer", "confidence": 0.79 }
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "predictions": [ ... ],
  "updated_at": "2026-10-08T14:31:00Z"
}
```
- **Error (409 Conflict):** If no resume has been uploaded yet.

---

### 2.4 Update Selected Role (Cascading Reset)
- **Endpoint:** `PATCH /api/session/role`
- **Auth:** `Bearer <token>`
- **Behavior:** Saving a new role automatically resets downstream state (`skill_gap: null`, `roadmap: null`, `roadmap_id: null`).
- **Request Body:**
```json
{
  "role": "Full Stack Engineer"
}
```
*(Accepts either `"role"` or `"selected_role"`)*
- **Response (200 OK):**
```json
{
  "success": true,
  "selected_role": "Full Stack Engineer",
  "updated_at": "2026-10-08T14:32:00Z"
}
```

---

### 2.5 Update Skill Gap (Cascading Reset)
- **Endpoint:** `PATCH /api/session/skill-gap`
- **Auth:** `Bearer <token>`
- **Behavior:** Saving a skill gap automatically resets downstream state (`roadmap: null`, `roadmap_id: null`).
- **Request Body:**
```json
{
  "skill_gap": {
    "matched_skills": ["Python", "FastAPI"],
    "missing_skills": ["Kubernetes", "GraphQL"],
    "readiness_score": 75
  }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "skill_gap": { ... },
  "updated_at": "2026-10-08T14:33:00Z"
}
```

---

### 2.6 Save Roadmap & Initialize Progress
- **Endpoint:** `PATCH /api/session/roadmap`
- **Auth:** `Bearer <token>`
- **Behavior:** Generates a new `roadmap_id`, parses `phases[].skills[]`, seeds individual skill progress records in `db.roadmap_progress` with `status: "not_started"`, and updates the session.
- **Request Body:**
```json
{
  "roadmap": {
    "role": "Full Stack Engineer",
    "target_timeline": "6 months",
    "phases": [
      {
        "phase": 1,
        "title": "Backend Mastery",
        "description": "Strengthen server architecture and async microservices",
        "duration": "4 weeks",
        "skills": ["AsyncIO", "Docker", "PostgreSQL"],
        "project": "Build an event-driven notification service",
        "courses": []
      },
      {
        "phase": 2,
        "title": "Cloud & CI/CD",
        "description": "Container orchestration and continuous integration",
        "duration": "4 weeks",
        "skills": ["Kubernetes", "GitHub Actions"],
        "project": "Deploy containerized cluster with automated pipeline",
        "courses": []
      }
    ],
    "final_project": "Production-grade microservices deployment",
    "career_advice": "Focus on high-availability patterns and distributed caching."
  }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "roadmap_id": "670425e4f18a24c13a290fb2",
  "roadmap": { ... },
  "updated_at": "2026-10-08T14:34:00Z"
}
```

---

### 2.7 Clear Session (Start Over)
- **Endpoint:** `DELETE /api/session/current`
- **Auth:** `Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Session cleared."
}
```

---

## 3. Roadmap Progress Tracking

### 3.1 Get Roadmap Progress (Grouped by Phase)
- **Endpoint:** `GET /api/progress/{roadmap_id}`
- **Auth:** `Bearer <token>`
- **Error Codes:** `400` (invalid ID format), `404` (not found), `403` (unauthorized).

#### Response (200 OK)
```json
{
  "roadmap_id": "670425e4f18a24c13a290fb2",
  "phases": [
    {
      "phase_number": 1,
      "skills": [
        {
          "skill_name": "AsyncIO",
          "status": "completed",
          "completed_at": "2026-10-08T14:40:00Z",
          "updated_at": "2026-10-08T14:40:00Z"
        },
        {
          "skill_name": "Docker",
          "status": "in_progress",
          "completed_at": null,
          "updated_at": "2026-10-08T14:35:00Z"
        },
        {
          "skill_name": "PostgreSQL",
          "status": "not_started",
          "completed_at": null,
          "updated_at": "2026-10-08T14:34:00Z"
        }
      ]
    },
    {
      "phase_number": 2,
      "skills": [
        {
          "skill_name": "Kubernetes",
          "status": "not_started",
          "completed_at": null,
          "updated_at": "2026-10-08T14:34:00Z"
        },
        {
          "skill_name": "GitHub Actions",
          "status": "not_started",
          "completed_at": null,
          "updated_at": "2026-10-08T14:34:00Z"
        }
      ]
    }
  ]
}
```

---

### 3.2 Update Skill Progress Status
- **Endpoint:** `PATCH /api/progress/{roadmap_id}/skill`
- **Auth:** `Bearer <token>`
- **Status Enum:** `"not_started"`, `"in_progress"`, `"completed"`

#### Request Body
```json
{
  "phase_number": 1,
  "skill_name": "AsyncIO",
  "status": "completed"
}
```

#### Response (200 OK)
```json
{
  "roadmap_id": "670425e4f18a24c13a290fb2",
  "phase_number": 1,
  "skill_name": "AsyncIO",
  "status": "completed",
  "completed_at": "2026-10-08T14:40:00Z",
  "updated_at": "2026-10-08T14:40:00Z"
}
```

#### Error Codes
- `400 Bad Request`: Invalid status value or malformed ID.
- `404 Not Found`: Skill not found in the roadmap.
- `403 Forbidden`: Roadmap belongs to another user.

---

### 3.3 Get Progress Summary Statistics
- **Endpoint:** `GET /api/progress/{roadmap_id}/summary`
- **Auth:** `Bearer <token>`
- **Description:** Aggregates overall and per-phase progress metrics.

#### Response (200 OK)
```json
{
  "overall_percent": 20,
  "total": 5,
  "completed": 1,
  "in_progress": 1,
  "not_started": 3,
  "per_phase": [
    {
      "phase_number": 1,
      "percent": 33
    },
    {
      "phase_number": 2,
      "percent": 0
    }
  ]
}
```

---

## 4. ATS Evaluation History

### 4.1 Save ATS Score Result
- **Endpoint:** `POST /api/ats-history`
- **Auth:** `Bearer <token>`
- **Description:** Saves the ATS evaluation returned by the career service. Automatically extracts up to the first 300 characters of the JD for snippet preview.

#### Request Body
```json
{
  "label": "Full Stack Engineer - TechCorp",
  "jd_snippet": "We are seeking a Senior Full Stack Engineer with 4+ years of experience in Python, FastAPI, and React...",
  "result": {
    "overall_score": 82,
    "matched_keywords": ["Python", "FastAPI", "React", "Docker"],
    "missing_keywords": ["GraphQL", "Kubernetes"],
    "feedback": "Strong foundational alignment; add distributed systems experience."
  }
}
```

#### Response (201 Created)
```json
{
  "id": "670429a1f18a24c13a290fbb",
  "user_id": "67041a99f18a24c13a290fa1",
  "label": "Full Stack Engineer - TechCorp",
  "jd_snippet": "We are seeking a Senior Full Stack Engineer with 4+ years of experience in Python, FastAPI, and React...",
  "result": {
    "overall_score": 82,
    "matched_keywords": ["Python", "FastAPI", "React", "Docker"],
    "missing_keywords": ["GraphQL", "Kubernetes"],
    "feedback": "Strong foundational alignment; add distributed systems experience."
  },
  "created_at": "2026-10-08T14:45:00Z"
}
```

---

### 4.2 List ATS History (Paginated)
- **Endpoint:** `GET /api/ats-history?limit=20&skip=0`
- **Auth:** `Bearer <token>`
- **Description:** Lists user's evaluations sorted newest first.

#### Response (200 OK)
```json
[
  {
    "id": "670429a1f18a24c13a290fbb",
    "user_id": "67041a99f18a24c13a290fa1",
    "label": "Full Stack Engineer - TechCorp",
    "jd_snippet": "We are seeking a Senior Full Stack Engineer...",
    "result": { "overall_score": 82 },
    "created_at": "2026-10-08T14:45:00Z"
  }
]
```

---

### 4.3 Get Single ATS History Entry
- **Endpoint:** `GET /api/ats-history/{id}`
- **Auth:** `Bearer <token>`
- **Response (200 OK):** Single ATS history record.
- **Errors:** `400` (invalid id), `404` (not found), `403` (forbidden).

---

### 4.4 Delete ATS History Entry
- **Endpoint:** `DELETE /api/ats-history/{id}`
- **Auth:** `Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "ATS score history entry deleted."
}
```

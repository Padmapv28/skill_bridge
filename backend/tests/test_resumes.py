RESUME_PAYLOAD = {
    "name": "Varsha",
    "email": "varsha@example.com",
    "education": [{"degree": "B.E", "branch": "Computer Science", "college": "SJCIT", "year": 2026}],
    "skills": ["Python", "SQL", "Pandas", "FastAPI"],
    "projects": [{"title": "AI Career Predictor", "description": "Career prediction system"}],
    "experience": [],
    "certifications": [],
}


def test_create_resume(client, auth_headers):
    headers = auth_headers(email="resume1@example.com")
    response = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Varsha"
    assert "Python" in body["skills"]
    assert "id" in body


def test_create_resume_unauthorized(client):
    response = client.post("/api/resumes", json=RESUME_PAYLOAD)
    assert response.status_code in (401, 403)


def test_list_resumes(client, auth_headers):
    headers = auth_headers(email="resume2@example.com")
    client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers)
    response = client.get("/api/resumes", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_single_resume(client, auth_headers):
    headers = auth_headers(email="resume3@example.com")
    created = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers).json()
    response = client.get(f"/api/resumes/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_update_resume(client, auth_headers):
    headers = auth_headers(email="resume4@example.com")
    created = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers).json()
    response = client.put(
        f"/api/resumes/{created['id']}", json={"skills": ["Python", "Docker"]}, headers=headers
    )
    assert response.status_code == 200
    assert "Docker" in response.json()["skills"]


def test_delete_resume(client, auth_headers):
    headers = auth_headers(email="resume5@example.com")
    created = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers).json()
    response = client.delete(f"/api/resumes/{created['id']}", headers=headers)
    assert response.status_code == 204

    follow_up = client.get(f"/api/resumes/{created['id']}", headers=headers)
    assert follow_up.status_code == 404


def test_resume_ownership_enforced(client, auth_headers):
    headers_a = auth_headers(email="ownerA@example.com")
    headers_b = auth_headers(email="ownerB@example.com")
    created = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers_a).json()

    response = client.get(f"/api/resumes/{created['id']}", headers=headers_b)
    assert response.status_code == 403

    response = client.delete(f"/api/resumes/{created['id']}", headers=headers_b)
    assert response.status_code == 403


def test_invalid_resume_id(client, auth_headers):
    headers = auth_headers(email="invalidid@example.com")
    response = client.get("/api/resumes/not-a-valid-id", headers=headers)
    assert response.status_code == 404


def test_analyze_resume_with_inline_data(client, auth_headers):
    headers = auth_headers(email="analyze1@example.com")
    response = client.post(
        "/api/analyze-resume",
        json={"skills": ["Python", "python", "SQL"], "certifications": ["AWS", "AWS"]},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    # normalized/de-duplicated (case-insensitive)
    assert len(body["skills"]) == 2
    assert len(body["certifications"]) == 1


def test_analyze_resume_with_resume_id(client, auth_headers):
    headers = auth_headers(email="analyze2@example.com")
    created = client.post("/api/resumes", json=RESUME_PAYLOAD, headers=headers).json()
    response = client.post("/api/analyze-resume", json={"resume_id": created["id"]}, headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "Python" in body["skills"]

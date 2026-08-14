def test_create_prediction(client, auth_headers):
    headers = auth_headers(email="pred1@example.com")
    response = client.post(
        "/api/predictions", json={"skills": ["Python", "SQL", "Pandas"]}, headers=headers
    )
    assert response.status_code == 201
    body = response.json()
    assert "predictions" in body
    assert len(body["predictions"]) > 0
    assert body["predictions"][0]["role"]
    assert "score" in body["predictions"][0]


def test_prediction_requires_skills_or_resume(client, auth_headers):
    headers = auth_headers(email="pred2@example.com")
    response = client.post("/api/predictions", json={}, headers=headers)
    assert response.status_code == 400


def test_prediction_unauthorized(client):
    response = client.post("/api/predictions", json={"skills": ["Python"]})
    assert response.status_code in (401, 403)


def test_skill_gap(client, auth_headers):
    headers = auth_headers(email="pred3@example.com")
    response = client.post(
        "/api/predictions/skill-gap",
        json={"role": "Data Analyst", "skills": ["Python", "SQL"]},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "Data Analyst"
    assert "Pandas" in body["missing_skills"]
    assert body["skill_gap_percentage"] > 0


def test_skill_gap_unknown_role(client, auth_headers):
    headers = auth_headers(email="pred4@example.com")
    response = client.post(
        "/api/predictions/skill-gap",
        json={"role": "Astronaut", "skills": ["Python"]},
        headers=headers,
    )
    assert response.status_code == 404


def test_list_and_get_prediction(client, auth_headers):
    headers = auth_headers(email="pred5@example.com")
    created = client.post("/api/predictions", json={"skills": ["Python"]}, headers=headers).json()

    listing = client.get("/api/predictions", headers=headers)
    assert listing.status_code == 200
    assert any(p["id"] == created["id"] for p in listing.json())

    single = client.get(f"/api/predictions/{created['id']}", headers=headers)
    assert single.status_code == 200
    assert single.json()["id"] == created["id"]


def test_prediction_ownership_enforced(client, auth_headers):
    headers_a = auth_headers(email="predOwnerA@example.com")
    headers_b = auth_headers(email="predOwnerB@example.com")
    created = client.post("/api/predictions", json={"skills": ["Python"]}, headers=headers_a).json()

    response = client.get(f"/api/predictions/{created['id']}", headers=headers_b)
    assert response.status_code == 403


def test_invalid_prediction_id(client, auth_headers):
    headers = auth_headers(email="predInvalid@example.com")
    response = client.get("/api/predictions/not-a-valid-id", headers=headers)
    assert response.status_code == 404

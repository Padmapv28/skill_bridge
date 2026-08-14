def test_generate_roadmap_with_missing_skills(client, auth_headers):
    headers = auth_headers(email="road1@example.com")
    response = client.post(
        "/api/roadmaps",
        json={"role": "Data Analyst", "missing_skills": ["Pandas", "Power BI"]},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "Data Analyst"
    assert len(body["roadmap"]) > 0
    assert body["roadmap"][0]["phase"] == 1


def test_generate_roadmap_from_role_only(client, auth_headers):
    headers = auth_headers(email="road2@example.com")
    response = client.post("/api/roadmaps", json={"role": "Backend Developer"}, headers=headers)
    assert response.status_code == 201
    body = response.json()
    total_skills = sum(len(phase["skills"]) for phase in body["roadmap"])
    assert total_skills > 0


def test_roadmap_unknown_role(client, auth_headers):
    headers = auth_headers(email="road3@example.com")
    response = client.post("/api/roadmaps", json={"role": "Astronaut"}, headers=headers)
    assert response.status_code == 404


def test_list_roadmaps(client, auth_headers):
    headers = auth_headers(email="road4@example.com")
    client.post("/api/roadmaps", json={"role": "Data Analyst", "missing_skills": ["SQL"]}, headers=headers)
    response = client.get("/api/roadmaps", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_and_delete_roadmap(client, auth_headers):
    headers = auth_headers(email="road5@example.com")
    created = client.post(
        "/api/roadmaps", json={"role": "Data Analyst", "missing_skills": ["SQL"]}, headers=headers
    ).json()

    single = client.get(f"/api/roadmaps/{created['id']}", headers=headers)
    assert single.status_code == 200

    deleted = client.delete(f"/api/roadmaps/{created['id']}", headers=headers)
    assert deleted.status_code == 204

    missing = client.get(f"/api/roadmaps/{created['id']}", headers=headers)
    assert missing.status_code == 404


def test_roadmap_ownership_enforced(client, auth_headers):
    headers_a = auth_headers(email="roadOwnerA@example.com")
    headers_b = auth_headers(email="roadOwnerB@example.com")
    created = client.post(
        "/api/roadmaps", json={"role": "Data Analyst", "missing_skills": ["SQL"]}, headers=headers_a
    ).json()

    response = client.get(f"/api/roadmaps/{created['id']}", headers=headers_b)
    assert response.status_code == 403

    response = client.delete(f"/api/roadmaps/{created['id']}", headers=headers_b)
    assert response.status_code == 403


def test_invalid_roadmap_id(client, auth_headers):
    headers = auth_headers(email="roadInvalid@example.com")
    response = client.get("/api/roadmaps/not-a-valid-id", headers=headers)
    assert response.status_code == 404

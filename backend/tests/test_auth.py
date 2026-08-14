def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Varsha", "email": "varsha@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Varsha"
    assert body["email"] == "varsha@example.com"
    assert "id" in body
    assert "password" not in body
    assert "hashed_password" not in body


def test_duplicate_registration(client):
    payload = {"name": "Varsha", "email": "dup@example.com", "password": "password123"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 409


def test_register_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Varsha", "email": "not-an-email", "password": "password123"},
    )
    assert response.status_code == 422


def test_register_weak_password(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Varsha", "email": "weak@example.com", "password": "onlyletters"},
    )
    assert response.status_code == 422


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={"name": "Varsha", "email": "login@example.com", "password": "password123"},
    )
    response = client.post("/api/auth/login", json={"email": "login@example.com", "password": "password123"})
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={"name": "Varsha", "email": "wrongpass@example.com", "password": "password123"},
    )
    response = client.post(
        "/api/auth/login", json={"email": "wrongpass@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "password123"})
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    headers = auth_headers(email="me@example.com")
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "me@example.com"


def test_get_current_user_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code in (401, 403)


def test_get_current_user_invalid_token(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401

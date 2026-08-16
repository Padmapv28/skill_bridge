def test_root_health(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Career Role Predictor API is running"}


def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_database_health(client):
    response = client.get("/api/health/database")
    # In a test/CI environment without a real MongoDB running, this is
    # expected to be "disconnected" - the endpoint must still respond
    # cleanly rather than crashing the app.
    assert response.status_code in (200, 503)
    body = response.json()
    assert body["database"] == "career_predictor"
    assert body["status"] in ("connected", "disconnected")

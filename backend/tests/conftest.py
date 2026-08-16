"""
Shared pytest fixtures.

Tests never touch a real MongoDB instance: the `get_db` dependency is
overridden with a mongomock in-memory database, so tests are fully
isolated and do not require any real MongoDB credentials.
"""
import os
import sys

import mongomock
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.mongodb import get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def mock_db():
    client = mongomock.MongoClient()
    yield client["career_predictor_test"]


@pytest.fixture()
def client(mock_db):
    def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    """Returns a helper that registers + logs in a user and returns auth headers."""

    def _register_and_login(name="Test User", email="test@example.com", password="password123"):
        client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
        response = client.post("/api/auth/login", json={"email": email, "password": password})
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _register_and_login

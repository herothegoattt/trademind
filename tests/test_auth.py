import pytest
from fastapi.testclient import TestClient


def test_register(client: TestClient):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "secret123"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


def test_register_duplicate(client: TestClient, user):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": user.email, "password": "other"},
    )
    assert r.status_code == 400


def test_login(client: TestClient, user):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password123"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password(client: TestClient, user):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "wrong"},
    )
    assert r.status_code == 401


def test_me(client: TestClient, auth_headers):
    r = client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert "email" in r.json()


def test_me_unauthorized(client: TestClient):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401  # no Bearer token

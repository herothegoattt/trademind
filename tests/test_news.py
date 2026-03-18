import pytest
from fastapi.testclient import TestClient


def test_news_refresh(client: TestClient):
    r = client.post("/api/v1/news/refresh")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    # mock returns three items after our latest changes
    assert data.get("count") == 3


def test_news_list_requires_auth(client: TestClient):
    r = client.get("/api/v1/news")
    assert r.status_code == 403


def test_news_list_after_refresh(client: TestClient, auth_headers):
    client.post("/api/v1/news/refresh")
    r = client.get("/api/v1/news", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

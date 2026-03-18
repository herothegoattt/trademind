import pytest
from fastapi.testclient import TestClient


def test_analyze_requires_auth(client: TestClient):
    r = client.post(
        "/api/v1/analyze",
        json={
            "mode": "trading",
            "title": "Test trade",
            "description": "Long EUR/USD",
            "is_loss": True,
            "outcome": "Stopped out",
        },
    )
    assert r.status_code == 403


def test_analyze_success(client: TestClient, auth_headers):
    r = client.post(
        "/api/v1/analyze",
        headers=auth_headers,
        json={
            "mode": "trading",
            "title": "Test trade",
            "description": "Long EUR/USD during news",
            "is_loss": True,
            "outcome": "Stopped out -2R",
            "trade_data": {"emotions": ["fear", "fomo"]},
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "key_insights" in data
    assert "recommendations" in data


def test_ai_chat_includes_news(client: TestClient):
    # refresh news to populate headlines
    client.post("/api/v1/news/refresh")
    r = client.post("/api/v1/ai/chat", json={
        "message": "Tell me something",
        "section": "Markets",
    })
    assert r.status_code == 200
    reply = r.json().get("reply", "")
    assert "🗞️" in reply or "Latest headlines" in reply

import pytest
from httpx import AsyncClient
from app.main import app
from app.seed import seed
from app.db.session import AsyncSessionLocal

@pytest.fixture(autouse=True, scope="session")
async def setup_db():
    # run migrations or assume existing
    await seed()
    yield

@pytest.mark.asyncio
async def test_trade_permissions():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # login as user1
        res = await ac.post("/auth/login", json={"email":"user1@trademind.io","password":"password"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # create a new trade
        trade_data = {
            "account_id": 1,
            "symbol": "EURUSD",
            "asset_class": "forex",
            "direction": "long",
            "entry_time": "2026-03-02T10:00:00",
            "entry_price": 1.1,
            "position_size": 100000,
            "balance_before_trade": 10000
        }
        res = await ac.post("/trades/", json=trade_data, headers=headers)
        assert res.status_code == 200
        trade_id = res.json()["id"]

        # try to get trade as another user (create second user)
        res2 = await ac.post("/auth/register", json={"email":"user2@trademind.io","password":"pass","name":"User Two"})
        token2 = res2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        res = await ac.get(f"/trades/{trade_id}", headers=headers2)
        assert res.status_code == 404

@pytest.mark.asyncio
async def test_community_access():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        res = await ac.post("/auth/login", json={"email":"user1@trademind.io","password":"password"})
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        # ensure approved post visible without auth
        res = await ac.get("/community/posts")
        assert res.status_code == 200
        posts = res.json()
        assert len(posts) >= 1

        # as normal user, cannot access moderation
        res = await ac.get("/admin/moderation/posts", headers=headers)
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_ai_chat_endpoint():
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # basic request should succeed (no auth required)
            res = await ac.post("/api/v1/ai/chat", json={"message": "test"})
            assert res.status_code == 200
            data = res.json()
            assert "reply" in data and isinstance(data["reply"], str)

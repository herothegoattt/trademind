import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password
from app.models.account import Account
from app.models.trade import Trade, DirectionEnum, OutcomeEnum
from app.models.community import CommunityPost, CommunityReview

async def seed():
    async with AsyncSessionLocal() as db:
        # create admin user
        admin = User(email="admin@trademind.io", hashed_password=hash_password("admin123"), name="Admin", is_admin=True)
        user1 = User(email="user1@trademind.io", hashed_password=hash_password("password"), name="User One")
        db.add_all([admin, user1])
        await db.commit()
        await db.refresh(user1)

        # account for user1
        acct = Account(user_id=user1.id, name="Demo", base_currency="USD", starting_balance=10000)
        db.add(acct)
        await db.commit()
        await db.refresh(acct)

        # trade example
        t = Trade(
            user_id=user1.id,
            account_id=acct.id,
            symbol="EURUSD",
            asset_class="forex",
            direction=DirectionEnum.long,
            entry_time="2026-03-01T10:00:00",
            exit_time="2026-03-01T12:00:00",
            entry_price=1.1,
            exit_price=1.12,
            position_size=100000,
            fees=10,
            stop_loss=1.09,
            outcome=OutcomeEnum.win,
            balance_before_trade=10000,
        )
        db.add(t)
        await db.commit()

        # community post
        post = CommunityPost(user_id=user1.id, title="Test idea", content="Buy EURUSD", status="approved")
        review = CommunityReview(user_id=user1.id, rating=5, short_title="Great app", text="Love it!", status="approved")
        db.add_all([post, review])
        await db.commit()

if __name__ == "__main__":
    asyncio.run(seed())

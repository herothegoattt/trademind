from fastapi import APIRouter

from app.api.routes import auth, users, journal, decisions, ai, news, bias, accounts, trades, community, admin

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(journal.router, prefix="/journal", tags=["journal"])
router.include_router(decisions.router, prefix="/decisions", tags=["decisions"])
router.include_router(ai.router, prefix="/ai", tags=["ai"])
router.include_router(news.router, prefix="/news", tags=["news"])
router.include_router(bias.router, prefix="/bias", tags=["bias"])

# new feature routers
router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
router.include_router(trades.router, prefix="/trades", tags=["trades"])
router.include_router(community.router, prefix="/community", tags=["community"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])

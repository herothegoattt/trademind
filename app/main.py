"""
TradeMind AI - Main FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import init_db
from app.api.routes import router
from app.api.auth import router as auth_router
from app.api.setups import router as setups_router
from app.api.news import router as news_router
from app.api.daily_bias import router as daily_bias_router
from app.api.ai import router as ai_router
from app.api.user_actions import router as user_actions_router
from app.api.investing import router as investing_router

_scheduler = None


def _start_scheduler():
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.services.news_fetcher import fetch_combined_financial_news
        from app.database import SessionLocal

        def job():
            db = SessionLocal()
            try:
                import asyncio
                items = asyncio.run(fetch_combined_financial_news())
                from app import crud
                crud.upsert_news(db, items)
            finally:
                db.close()

        _scheduler = BackgroundScheduler()
        _scheduler.add_job(job, "interval", minutes=60, id="news_refresh")
        _scheduler.start()
    except Exception as e:
        print(f"Scheduler not started: {e}")


def _stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("Database initialized")
    _start_scheduler()
    yield
    _stop_scheduler()


app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    openapi_tags=[
        {"name": "auth", "description": "Register, login, Google sign-in, me, logout"},
        {"name": "decisions", "description": "Decision journal and list"},
        {"name": "analysis", "description": "Analyze decisions and get insights"},
        {"name": "setups", "description": "Trading setups/frameworks and compliance check"},
        {"name": "news", "description": "News feed and refresh"},
        {"name": "daily-bias", "description": "Daily bias / morning brief"},
        {"name": "ai", "description": "AI chat and analyze"},
        {"name": "user-actions", "description": "User action logs and analytics"},
        {"name": "investing", "description": "Portfolio management and long-term investing"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)
app.include_router(setups_router)
app.include_router(news_router)
app.include_router(daily_bias_router)
app.include_router(ai_router)
app.include_router(user_actions_router)
app.include_router(investing_router)


@app.get("/")
def root():
    return {
        "message": "TradeMind AI API",
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

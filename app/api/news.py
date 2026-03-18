"""News endpoints."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database import get_db
from app.api.deps import get_current_user_forbidden
from app.models import User
from app import crud

router = APIRouter(prefix="/api/v1", tags=["news"])


class NewsItemResponse(BaseModel):
    id: int
    title: str
    source: str | None
    summary: str | None
    impact: str
    fetched_at: datetime | None

    class Config:
        from_attributes = True


@router.get("/news", response_model=List[NewsItemResponse])
async def list_news(limit: int = 50, db=Depends(get_db), current_user: User = Depends(get_current_user_forbidden)):
    items = crud.get_news(db, limit=limit)
    # If DB has no news yet, fetch live and populate
    if not items:
        try:
            from app.services.news_fetcher import fetch_combined_financial_news
            new_items = await fetch_combined_financial_news(limit)
            if new_items:
                crud.upsert_news(db, new_items)
                items = crud.get_news(db, limit=limit)
        except Exception:
            # Fall back to empty list if fetch fails
            items = []

    return [NewsItemResponse.model_validate(n) for n in items]


@router.post("/news/refresh")
async def news_refresh(db=Depends(get_db)):
    """Trigger news fetch (mock)."""
    from app.services.news_fetcher import fetch_combined_financial_news
    items = await fetch_combined_financial_news()
    crud.upsert_news(db, items)
    return {"status": "ok", "count": len(items)}

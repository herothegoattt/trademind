"""AI chat and analyze endpoints — with plan-based quota enforcement."""

import logging
from datetime import datetime, timezone
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models import User
from app.services.ai_engine import chat, analyze_trading_error, generate_trading_setup

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["ai"])

# ─── Per-plan monthly AI query limits (None = unlimited) ─────────────────────
PLAN_AI_LIMITS: dict[str, int | None] = {
    "core":  5,
    "edge":  100,
    "apex":  None,
}


def _check_and_increment_quota(user: User, db: Session) -> None:
    """
    Raises HTTP 429 if the user has exhausted their monthly AI quota.
    Resets the counter if a new calendar month has started.
    """
    plan = getattr(user, "plan", "core") or "core"
    limit = PLAN_AI_LIMITS.get(plan, 5)

    now = datetime.now(timezone.utc)

    # Reset counter if it's a new month
    reset_at = getattr(user, "ai_quota_reset_at", None)
    if reset_at is None or (now.year, now.month) > (reset_at.year, reset_at.month):
        user.ai_queries_this_month = 0
        user.ai_quota_reset_at = now
        db.flush()

    if limit is not None:
        used = getattr(user, "ai_queries_this_month", 0) or 0
        if used >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "ai_quota_exceeded",
                    "used": used,
                    "limit": limit,
                    "plan": plan,
                    "message": f"You've used all {limit} AI queries this month. Upgrade your plan for more.",
                },
            )

    # Increment
    user.ai_queries_this_month = (getattr(user, "ai_queries_this_month", 0) or 0) + 1
    db.commit()


# ─── Schemas ──────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    section: Optional[str] = "Journal"
    error_type: Optional[str] = None
    context: Optional[Any] = None
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    reply: str
    quota_used: Optional[int] = None
    quota_limit: Optional[int] = None


class TradeAnalysisRequest(BaseModel):
    entry_price: float
    exit_price: float
    stop_loss: float
    position_size: float
    r_r_ratio: Optional[float] = None
    result: str
    notes: str
    language: Optional[str] = "en"


class TradeAnalysisResponse(BaseModel):
    analysis: str


class SetupGenerationRequest(BaseModel):
    description: str
    market: Optional[str] = "Forex"
    timeframe: Optional[str] = "4H"
    language: Optional[str] = "en"


class SetupGenerationResponse(BaseModel):
    setup: str


# ─── Endpoints ────────────────────────────────────────────────────────────────
@router.post("/ai/chat", response_model=ChatResponse)
def ai_chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Send a message and get AI trading insights. Enforces monthly quota."""
    _check_and_increment_quota(current_user, db)

    response_text = chat(
        message=body.message,
        section=body.section,
        error_type=body.error_type,
        context=body.context,
        language=body.language,
    )

    plan = getattr(current_user, "plan", "core") or "core"
    limit = PLAN_AI_LIMITS.get(plan, 5)
    used = getattr(current_user, "ai_queries_this_month", 0) or 0

    return ChatResponse(
        reply=response_text,
        quota_used=used,
        quota_limit=limit,
    )


@router.post("/ai/analyze-trade", response_model=TradeAnalysisResponse)
def analyze_trade(
    body: TradeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TradeAnalysisResponse:
    """Analyze a completed trade. Requires Edge+ plan."""
    plan = getattr(current_user, "plan", "core") or "core"
    if plan == "core":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "plan_required", "plan": "edge", "message": "Trade analysis requires Edge or Apex plan."},
        )

    _check_and_increment_quota(current_user, db)

    trade_data = {
        "entry_price": body.entry_price,
        "exit_price": body.exit_price,
        "stop_loss": body.stop_loss,
        "position_size": body.position_size,
        "r_r_ratio": body.r_r_ratio,
        "result": body.result,
        "notes": body.notes,
    }
    analysis = analyze_trading_error(trade_data, body.language)
    return TradeAnalysisResponse(analysis=analysis)


@router.post("/ai/generate-setup", response_model=SetupGenerationResponse)
def generate_setup(
    body: SetupGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SetupGenerationResponse:
    """Generate a trading setup. Requires Edge+ plan."""
    plan = getattr(current_user, "plan", "core") or "core"
    if plan == "core":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "plan_required", "plan": "edge", "message": "Setup generation requires Edge or Apex plan."},
        )

    _check_and_increment_quota(current_user, db)

    setup = generate_trading_setup(
        description=body.description,
        market=body.market or "Forex",
        timeframe=body.timeframe or "4H",
        language=body.language,
    )
    return SetupGenerationResponse(setup=setup)


@router.get("/ai/quota")
def get_quota(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Return the user's current AI quota status."""
    plan = getattr(current_user, "plan", "core") or "core"
    limit = PLAN_AI_LIMITS.get(plan, 5)
    used = getattr(current_user, "ai_queries_this_month", 0) or 0
    reset_at = getattr(current_user, "ai_quota_reset_at", None)
    return {
        "plan": plan,
        "quota_used": used,
        "quota_limit": limit,
        "quota_remaining": None if limit is None else max(0, limit - used),
        "reset_at": reset_at.isoformat() if reset_at else None,
    }

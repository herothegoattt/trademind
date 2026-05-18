"""AI chat and analyze endpoints — with plan-based quota enforcement."""

import logging
from datetime import datetime, timedelta, timezone
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

# ─── Per-plan daily AI prompt limits ─────────────────────────────────────────
PLAN_AI_LIMITS: dict[str, int | None] = {
    "core":  3,
    "edge":  5,
    "apex":  20,
}


def _check_and_increment_quota(user: User, db: Session) -> dict:
    """
    Raises HTTP 429 if the user has exhausted their 24-hour AI quota.
    Uses a rolling 24h window starting from the first prompt of each period.
    Returns quota info dict on success.
    """
    plan = getattr(user, "plan", "core") or "core"
    limit = PLAN_AI_LIMITS.get(plan, 3)

    now = datetime.now(timezone.utc)

    reset_at = getattr(user, "ai_quota_reset_at", None)
    window_expired = reset_at is None or (now - reset_at.replace(tzinfo=timezone.utc) if reset_at.tzinfo is None else now - reset_at) >= timedelta(hours=24)

    if window_expired:
        user.ai_queries_this_month = 0
        user.ai_quota_reset_at = now
        reset_at = now
        db.flush()

    used = getattr(user, "ai_queries_this_month", 0) or 0
    reset_at_aware = reset_at.replace(tzinfo=timezone.utc) if reset_at and reset_at.tzinfo is None else reset_at
    resets_at = (reset_at_aware + timedelta(hours=24)) if reset_at_aware else None

    if limit is not None and used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "ai_quota_exceeded",
                "used": used,
                "limit": limit,
                "plan": plan,
                "resets_at": resets_at.isoformat() if resets_at else None,
            },
        )

    user.ai_queries_this_month = used + 1
    db.commit()
    return {"used": used + 1, "limit": limit, "resets_at": resets_at.isoformat() if resets_at else None}


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
    limit = PLAN_AI_LIMITS.get(plan, 3)
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
    """Analyze a completed trade. Available to all plans (daily quota applies)."""
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
    """Generate a trading setup. Available to all plans (daily quota applies)."""
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
    """Return the user's current daily AI quota status (read-only, no increment)."""
    plan = getattr(current_user, "plan", "core") or "core"
    limit = PLAN_AI_LIMITS.get(plan, 3)
    used = getattr(current_user, "ai_queries_this_month", 0) or 0
    reset_at = getattr(current_user, "ai_quota_reset_at", None)
    now = datetime.now(timezone.utc)
    reset_at_aware = reset_at.replace(tzinfo=timezone.utc) if reset_at and reset_at.tzinfo is None else reset_at
    window_expired = reset_at_aware is None or (now - reset_at_aware) >= timedelta(hours=24)
    if window_expired:
        used = 0
    resets_at = (reset_at_aware + timedelta(hours=24)).isoformat() if reset_at_aware and not window_expired else None
    return {
        "plan": plan,
        "quota_used": used,
        "quota_limit": limit,
        "quota_remaining": None if limit is None else max(0, limit - used),
        "resets_at": resets_at,
        "period": "daily",
    }


@router.post("/ai/quota/consume")
def consume_quota(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Check and atomically increment the user's daily AI quota.
    Called by the Next.js chat route before invoking Claude.
    Returns 429 if quota exceeded, 200 with quota info otherwise.
    """
    quota_info = _check_and_increment_quota(current_user, db)
    return {"ok": True, **quota_info}

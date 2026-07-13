"""
API routes: health, decisions, analyze.
All decision/insight endpoints require auth and are scoped by user_id.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.deps import get_current_user, get_current_user_optional
from app.models import User
from app.schemas.decision import Decision, Insight, DecisionCreate
from app.services.analysis import AnalysisService
from app import crud
from fastapi import Response

from app.services import market_data as market_data_service

router = APIRouter(prefix="/api/v1", tags=["decisions", "analysis"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Extended health: status, db connectivity, news last updated.
    """
    from sqlalchemy import text
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    news_last = crud.get_news_last_updated(db) if db_ok else None
    return {
        "message": "TradeMind AI API",
        "version": "1.0.0",
        "status": "operational" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "news_last_updated": news_last.isoformat() if news_last else None,
    }


@router.get("/analysis/top-errors")
async def get_top_errors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Get top trading errors for the current user (by frequency from decisions)."""
    if not current_user:
        # Return mock data for development
        return [
            {"name": "Revenge Decision", "pct": 24},
            {"name": "FOMO", "pct": 18},
            {"name": "Overconfidence", "pct": 12},
        ]
    
    insights = crud.get_insights_by_user(db, current_user.id, limit=100)
    error_counts = {}
    
    for insight in insights:
        # Extract error types from insight patterns
        if insight.patterns:
            patterns = insight.patterns if isinstance(insight.patterns, list) else [insight.patterns]
            for pattern in patterns:
                error_counts[pattern] = error_counts.get(pattern, 0) + 1
    
    # Sort by count and return top 7
    sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)[:7]
    return [{"name": name, "pct": min(int((count / max(1, len(insights))) * 100), 100)} for name, count in sorted_errors]


@router.get("/analysis/error-details/{error_type}")
async def get_error_details(
    error_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Get details about a specific error type."""
    error_details_map = {
        "FOMO": {
            "description": "Fear of missing out leads to impulsive entries.",
            "recognitionSignals": [
                "Entering after a big move",
                "Ignoring your own plan",
                "Overtrading when market moves without you",
            ],
            "correctiveRule": "Set strict entry criteria and wait; if unsure, stay out.",
        },
        "Overconfidence": {
            "description": "Overestimating your edge after wins.",
            "recognitionSignals": [
                "Increasing size after a streak",
                "Ignoring market warnings",
                "Chasing unrealistic returns",
            ],
            "correctiveRule": "Revert to base position sizing and review at end of day.",
        },
        "Decision Under Fatigue": {
            "description": "Tiredness causing poor judgment.",
            "recognitionSignals": [
                "Making decisions late at night",
                "Skipping analysis steps",
                "Poor risk assessment",
            ],
            "correctiveRule": "Stop trading when tired; only trade during peak hours.",
        },
        "Revenge Decision": {
            "description": "Wanting to recover losses immediately.",
            "recognitionSignals": [
                "Larger than normal size after a loss",
                "Skipping entry rules",
                "Trading emotionally",
            ],
            "correctiveRule": "Take a break after losses; return to base size.",
        },
        "Confirmation Bias": {
            "description": "Only seeing evidence that confirms beliefs.",
            "recognitionSignals": [
                "Ignoring conflicting signals",
                "Over-weighting bullish data",
                "Missing bearish warnings",
            ],
            "correctiveRule": "Always look for disconfirming evidence first.",
        },
        "Risk Miscalculation": {
            "description": "Underestimating downside exposure.",
            "recognitionSignals": [
                "Positions larger than risk model",
                "Ignoring correlation",
                "Overusing leverage",
            ],
            "correctiveRule": "Follow strict position sizing rules.",
        },
        "Ignoring Invalid Signals": {
            "description": "Trading signals that fail entry confirmation.",
            "recognitionSignals": [
                "Entering on first touch",
                "Ignoring volume confirmation",
                "No confluence check",
            ],
            "correctiveRule": "Wait for 3 confirmations before entry.",
        },
    }
    
    return error_details_map.get(error_type, {
        "description": f"Error type: {error_type}",
        "recognitionSignals": ["Monitor your trading closely"],
        "correctiveRule": "Review trading rules and improve discipline.",
    })


@router.post("/analyze", response_model=Insight)
async def analyze_decision(
    decision: DecisionCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> Insight:
    """
    Analyze a past decision. With auth: save decision + insight to DB. Without auth: return 403.
    """
    try:
        # require authentication before running analysis logic
        if current_user is None:
            raise HTTPException(status_code=403, detail="Forbidden")

        decision_for_analysis = Decision(
            id=None,
            mode=decision.mode,
            title=decision.title,
            description=decision.description,
            outcome=decision.outcome,
            is_loss=decision.is_loss,
            trade_data=decision.trade_data.model_dump() if decision.trade_data else None,
            investment_data=decision.investment_data.model_dump() if decision.investment_data else None,
            business_data=decision.business_data.model_dump() if decision.business_data else None,
            personal_data=decision.personal_data.model_dump() if decision.personal_data else None,
        )
        insight = AnalysisService.analyze_decision(decision_for_analysis)
        # Require authentication for saving analysis
        if current_user is None:
            raise HTTPException(status_code=403, detail="Forbidden")
        db_decision = crud.create_decision(db, decision, current_user.id)
        db_insight = crud.create_insight(db, current_user.id, db_decision.id, insight)
        return Insight.model_validate(db_insight)
    except HTTPException:
        # allow explicit HTTP errors (401/403/etc.) to propagate
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/decisions", response_model=List[Decision])
async def get_decisions(
    skip: int = 0,
    limit: int = 100,
    mode: Optional[str] = None,
    is_loss: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List decisions for current user."""
    return crud.get_decisions(db, current_user.id, skip=skip, limit=limit, mode=mode, is_loss=is_loss)


@router.get("/decisions/{decision_id}", response_model=Decision)
async def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = crud.get_decision(db, decision_id, current_user.id)
    if not d:
        raise HTTPException(status_code=404, detail="Decision not found")
    return d


@router.get("/decisions/{decision_id}/insight", response_model=Insight)
async def get_decision_insight(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not crud.get_decision(db, decision_id, current_user.id):
        raise HTTPException(status_code=404, detail="Decision not found")
    insight = crud.get_insight_by_decision(db, decision_id, current_user.id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found for this decision")
    return insight


@router.get("/markets")
async def get_markets(limit: int = 50):
    """Return market data (OANDA -> fallback)."""
    try:
        data = await market_data_service.fetch_market_data(limit)
        return data or []
    except Exception as e:
        return []


# ---- Trade Journal Endpoints ----

@router.post("/journals/trades", response_model=dict)
async def create_trade(
    trade_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new trade journal entry."""
    from app.schemas.trade import TradeCreate
    from app.models import Trade
    
    try:
        # Add user_id to the trade data
        trade_dict = {
            "user_id": current_user.id,
            **trade_data
        }
        
        db_trade = Trade(user_id=current_user.id, **{k: v for k, v in trade_data.items() if k not in ['user_id']})
        db.add(db_trade)
        db.commit()
        db.refresh(db_trade)
        
        return {
            "id": db_trade.id,
            "symbol": db_trade.symbol,
            "type": db_trade.type,
            "entry": db_trade.entry,
            "exit": db_trade.exit,
            "account_size": db_trade.account_size,
            "duration": db_trade.duration,
            "notes": db_trade.notes,
            "pnl": db_trade.pnl,
            "pnl_percent": db_trade.pnl_percent,
            "created_at": db_trade.created_at.isoformat(),
            "updated_at": db_trade.updated_at.isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/journals/trades")
async def list_trades(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all trades for the current user."""
    from app.models import Trade
    
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).order_by(Trade.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "symbol": t.symbol,
            "type": t.type,
            "entry": t.entry,
            "exit": t.exit,
            "account_size": t.account_size,
            "duration": t.duration,
            "notes": t.notes,
            "pnl": t.pnl,
            "pnl_percent": t.pnl_percent,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat(),
        }
        for t in trades
    ]


@router.get("/journals/trades/{trade_id}")
async def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific trade by ID."""
    from app.models import Trade
    
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    return {
        "id": trade.id,
        "symbol": trade.symbol,
        "type": trade.type,
        "entry": trade.entry,
        "exit": trade.exit,
        "account_size": trade.account_size,
        "duration": trade.duration,
        "notes": trade.notes,
        "pnl": trade.pnl,
        "pnl_percent": trade.pnl_percent,
        "created_at": trade.created_at.isoformat(),
        "updated_at": trade.updated_at.isoformat(),
    }


@router.put("/journals/trades/{trade_id}")
async def update_trade(
    trade_id: int,
    trade_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a trade."""
    from app.models import Trade
    
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    for key, value in trade_data.items():
        if value is not None and key != "id" and key != "user_id":
            setattr(trade, key, value)
    
    db.commit()
    db.refresh(trade)
    
    return {
        "id": trade.id,
        "symbol": trade.symbol,
        "type": trade.type,
        "entry": trade.entry,
        "exit": trade.exit,
        "account_size": trade.account_size,
        "duration": trade.duration,
        "notes": trade.notes,
        "pnl": trade.pnl,
        "pnl_percent": trade.pnl_percent,
        "created_at": trade.created_at.isoformat(),
        "updated_at": trade.updated_at.isoformat(),
    }


@router.delete("/journals/trades/{trade_id}")
async def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a trade."""
    from app.models import Trade
    
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    
    db.delete(trade)
    db.commit()
    
    return {"message": "Trade deleted successfully"}


# ---------------------------------------------------------------------------
# Binance proxy — Vercel (US) can't fetch real PAXGUSDT data because
# api.binance.com returns US-limited data from AWS us-east-1.  The backend
# (Render, Frankfurt) has unrestricted access, so we proxy raw klines &
# aggTrades through it.
# ---------------------------------------------------------------------------
import httpx

BINANCE_SPOT = "https://api.binance.com/api/v3"
BINANCE_FUTURES = "https://fapi.binance.com/fapi/v1"
BINANCE_US = "https://api.binance.us/api/v3"


async def _proxy_binance(
    client: httpx.AsyncClient,
    path: str,
    params: dict,
):
    """Try Binance futures (globally accessible), then spot, then Binance.US."""
    for base in (BINANCE_FUTURES, BINANCE_SPOT, BINANCE_US):
        try:
            resp = await client.get(
                f"{base}/{path}",
                params=params,
                headers={"Cache-Control": "no-cache"},
            )
            if resp.status_code == 451:
                continue
            resp.raise_for_status()
            return JSONResponse(content=resp.json())
        except httpx.HTTPStatusError:
            continue
    raise HTTPException(status_code=502, detail="Binance data unavailable")


@router.get("/binance/klines")
async def binance_klines(
    symbol: str,
    interval: str = "5m",
    limit: int = 48,
):
    async with httpx.AsyncClient(timeout=15.0) as client:
        return await _proxy_binance(
            client, "klines",
            {"symbol": symbol, "interval": interval, "limit": limit},
        )


@router.get("/binance/aggTrades")
async def binance_agg_trades(
    symbol: str,
    startTime: int,
    endTime: int,
    limit: int = 1000,
):
    async with httpx.AsyncClient(timeout=15.0) as client:
        return await _proxy_binance(
            client, "aggTrades",
            {"symbol": symbol, "startTime": startTime, "endTime": endTime, "limit": limit},
        )

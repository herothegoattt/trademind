"""AI chat and analyze endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any

from app.api.deps import get_current_user
from app.models import User
from app.services.ai_engine import chat, analyze_trading_error, generate_trading_setup

router = APIRouter(prefix="/api/v1", tags=["ai"])


class ChatRequest(BaseModel):
    message: str
    section: Optional[str] = "Journal"
    error_type: Optional[str] = None
    context: Optional[Any] = None
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    reply: str


class TradeAnalysisRequest(BaseModel):
    """Request for analyzing a trade or trading error."""
    entry_price: float
    exit_price: float
    stop_loss: float
    position_size: float
    r_r_ratio: Optional[float] = None
    result: str  # "Win", "Loss", "Break-even"
    notes: str
    language: Optional[str] = "en"


class TradeAnalysisResponse(BaseModel):
    analysis: str


class SetupGenerationRequest(BaseModel):
    """Request for generating a trading setup."""
    description: str
    market: Optional[str] = "Forex"
    timeframe: Optional[str] = "4H"
    language: Optional[str] = "en"


class SetupGenerationResponse(BaseModel):
    setup: str


@router.post("/ai/chat", response_model=ChatResponse)
def ai_chat(body: ChatRequest) -> ChatResponse:
    """Send a message and get AI trading insights with error pattern recognition."""
    response_text = chat(
        message=body.message,
        section=body.section,
        error_type=body.error_type,
        context=body.context,
        language=body.language
    )
    return ChatResponse(reply=response_text)


@router.post("/ai/analyze-trade", response_model=TradeAnalysisResponse)
def analyze_trade(body: TradeAnalysisRequest) -> TradeAnalysisResponse:
    """Analyze a completed trade and provide improvement insights."""
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
def generate_setup(body: SetupGenerationRequest) -> SetupGenerationResponse:
    """Generate a detailed, repeatable trading setup based on description."""
    setup = generate_trading_setup(
        description=body.description,
        market=body.market or "Forex",
        timeframe=body.timeframe or "4H",
        language=body.language
    )
    return SetupGenerationResponse(setup=setup)


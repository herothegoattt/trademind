"""
Pydantic schemas for Journal Trade objects.
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class TradeCreate(BaseModel):
    """Schema for creating a new trade."""
    symbol: str = Field(..., description="Trading pair (e.g., EURUSD)")
    type: Literal["long", "short"] = Field(..., description="Trade type: long or short")
    entry: float = Field(..., description="Entry price")
    exit: Optional[float] = Field(None, description="Exit price")
    account_size: Optional[float] = Field(None, description="Account size for risk calculation")
    duration: str = Field(..., description="How long the trade was held (e.g., '2h', '30m')")
    notes: str = Field(default="", description="Trade notes and reasoning")
    pnl: Optional[float] = Field(None, description="Profit/Loss (calculated)")
    pnl_percent: Optional[float] = Field(None, description="Profit/Loss percentage (calculated)")


class Trade(BaseModel):
    """Complete trade object."""
    id: int = Field(..., description="Unique trade ID")
    user_id: int = Field(..., description="User ID")
    symbol: str
    type: Literal["long", "short"]
    entry: float
    exit: Optional[float] = None
    account_size: Optional[float] = None
    duration: str
    notes: str
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TradeUpdate(BaseModel):
    """Schema for updating a trade."""
    symbol: Optional[str] = None
    type: Optional[Literal["long", "short"]] = None
    entry: Optional[float] = None
    exit: Optional[float] = None
    account_size: Optional[float] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    pnl: Optional[float] = None
    pnl_percent: Optional[float] = None


class TradeStats(BaseModel):
    """Statistics calculated from trades."""
    total_trades: int
    total_pnl: float
    winning_trades: int
    losing_trades: int
    win_rate: float
    avg_win: float
    avg_loss: float
    best_trade: float
    worst_trade: float

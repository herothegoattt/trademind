from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class Direction(str, Enum):
    long = "long"
    short = "short"

class Outcome(str, Enum):
    win = "win"
    loss = "loss"
    breakeven = "breakeven"

class TradeBase(BaseModel):
    symbol: str
    asset_class: str
    direction: Direction
    entry_time: datetime
    exit_time: Optional[datetime] = None
    entry_price: float
    exit_price: Optional[float] = None
    position_size: float
    fees: Optional[float] = 0
    leverage: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    thesis: Optional[str] = None
    setup_tags: Optional[str] = None
    emotions: Optional[str] = None
    outcome: Optional[Outcome] = None
    balance_before_trade: float

class TradeCreate(TradeBase):
    account_id: int

class TradeUpdate(BaseModel):
    exit_time: Optional[datetime]
    exit_price: Optional[float]
    fees: Optional[float]
    leverage: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    thesis: Optional[str]
    setup_tags: Optional[str]
    emotions: Optional[str]
    outcome: Optional[Outcome]
    balance_before_trade: Optional[float]

class TradeSchema(TradeBase):
    id: int
    user_id: int
    account_id: int
    created_at: datetime

    class Config:
        orm_mode = True

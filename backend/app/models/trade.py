from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
from sqlalchemy.sql import func
import enum

class DirectionEnum(enum.Enum):
    long = "long"
    short = "short"

class OutcomeEnum(enum.Enum):
    win = "win"
    loss = "loss"
    breakeven = "breakeven"

class Trade(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    asset_class = Column(String, nullable=False, index=True)
    direction = Column(Enum(DirectionEnum), nullable=False)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)
    entry_price = Column(Numeric(20, 8), nullable=False)
    exit_price = Column(Numeric(20, 8))
    position_size = Column(Numeric(20, 4), nullable=False)
    fees = Column(Numeric(18, 4), default=0)
    leverage = Column(Numeric(10, 2))
    stop_loss = Column(Numeric(20, 8))
    take_profit = Column(Numeric(20, 8))
    thesis = Column(String)
    setup_tags = Column(String)  # comma-separated tags for MVP
    emotions = Column(String)
    outcome = Column(Enum(OutcomeEnum))
    balance_before_trade = Column(Numeric(18, 4), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="trades")
    account = relationship("Account", back_populates="trades")

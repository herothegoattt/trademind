"""
Database models for TradeMind AI.
"""

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base  # noqa: I001


class User(Base):
    """User account (email/password or Google)."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # null if Google-only
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    decisions = relationship("Decision", back_populates="user")
    insights = relationship("Insight", back_populates="user")
    setups = relationship("Setup", back_populates="user")
    actions = relationship("UserAction", back_populates="user")


class Decision(Base):
    """Model for storing decisions/trades."""

    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    is_loss = Column(Boolean, default=False)
    outcome = Column(Text, nullable=True)

    trade_data = Column(JSON, nullable=True)
    investment_data = Column(JSON, nullable=True)
    business_data = Column(JSON, nullable=True)
    personal_data = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="decisions")


class Insight(Base):
    """Model for storing analysis insights."""

    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    decision_id = Column(Integer, nullable=False, index=True)
    mode = Column(String, nullable=False)

    key_insights = Column(JSON, nullable=True)
    technical_patterns = Column(JSON, nullable=True)
    psychological_patterns = Column(JSON, nullable=True)
    mistakes = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    prevention_strategies = Column(JSON, nullable=True)

    decision_quality_score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)

    analysis_timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="insights")


class Setup(Base):
    """Trading setup / framework (rules for compliance check)."""

    __tablename__ = "setups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    rules = Column(JSON, nullable=False)  # list of rule strings

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="setups")


class NewsItem(Base):
    """News item (fetched by scheduler)."""

    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    source = Column(String(255))
    url = Column(Text)
    summary = Column(Text)
    impact = Column(String(32), default="neutral")  # high, medium, low, neutral
    published_at = Column(DateTime(timezone=True), nullable=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())


class Trade(Base):
    """Journal trade entries."""

    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)  # EURUSD, GBPUSD, etc.
    type = Column(String(10), nullable=False)  # 'long' or 'short'
    entry = Column(Float, nullable=False)
    exit = Column(Float, nullable=True)
    account_size = Column(Float, nullable=True)
    duration = Column(String(50), nullable=False)  # e.g., "2h", "30m"
    notes = Column(Text)
    pnl = Column(Float, nullable=True)
    pnl_percent = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="trades")


class DailyBias(Base):
    """Daily bias / morning brief (generated per day)."""

    __tablename__ = "daily_bias"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), unique=True, index=True, nullable=False)  # YYYY-MM-DD
    brief = Column(Text, nullable=False)
    warning_zones = Column(JSON, nullable=True)  # list of strings
    sentiment = Column(String(32), default="neutral")  # bullish, bearish, neutral
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAction(Base):
    """Track all user actions for analytics and audit."""

    __tablename__ = "user_actions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(100), nullable=False, index=True)  # 'create_decision', 'analyze', 'update_trade', etc.
    resource_type = Column(String(100), nullable=True)  # 'decision', 'trade', 'setup', 'journal', etc.
    resource_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    action_metadata = Column(JSON, nullable=True)  # additional action data
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    status = Column(String(20), default="success")  # success, error
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    user = relationship("User", back_populates="actions")


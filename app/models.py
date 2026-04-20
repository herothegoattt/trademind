"""
Database models for TradeMind AI.
"""

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text, JSON, ForeignKey, BigInteger
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
    # Subscription / plan
    plan = Column(String(20), default="core", nullable=False, server_default="core")
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    plan_expires_at = Column(DateTime(timezone=True), nullable=True)
    # AI usage quota tracking (resets monthly)
    ai_queries_this_month = Column(Integer, default=0, nullable=False, server_default="0")
    ai_quota_reset_at = Column(DateTime(timezone=True), nullable=True)
    # Referral & credits
    referred_by_code = Column(String(20), nullable=True)         # code used at signup
    referral_credits_cents = Column(Integer, default=0, nullable=False, server_default="0")
    # Onboarding
    is_onboarded = Column(Boolean, default=False, nullable=False, server_default="false")
    preferred_market = Column(String(50), nullable=True)
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


class PromoCode(Base):
    """Admin-created promo/discount codes."""

    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)  # e.g. LAUNCH50
    description = Column(String(255), nullable=True)
    # Discount: "percent" (0–100) or "fixed" (USD cents)
    discount_type = Column(String(10), nullable=False, default="percent")
    discount_value = Column(Float, nullable=False)          # e.g. 25 for 25%  |  2900 for $29
    # Applicability
    applies_to = Column(String(20), nullable=True)          # null=any, "edge", "apex"
    billing_cycle = Column(String(10), nullable=True)       # null=any, "monthly", "annual"
    # Limits
    max_uses = Column(Integer, nullable=True)               # null = unlimited
    uses_count = Column(Integer, default=0, nullable=False, server_default="0")
    # Validity
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    # Stripe coupon (created on first use)
    stripe_coupon_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReferralCode(Base):
    """Each user's personal referral code."""

    __tablename__ = "referral_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g. TM-ALEX4K2M
    total_clicks = Column(Integer, default=0, nullable=False, server_default="0")
    total_signups = Column(Integer, default=0, nullable=False, server_default="0")
    total_conversions = Column(Integer, default=0, nullable=False, server_default="0")  # paid upgrades
    total_earned_cents = Column(Integer, default=0, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    uses = relationship("ReferralUse", back_populates="referral_code")


class ReferralUse(Base):
    """Tracks each time a referral code led to a signup or conversion."""

    __tablename__ = "referral_uses"

    id = Column(Integer, primary_key=True, index=True)
    referral_code_id = Column(Integer, ForeignKey("referral_codes.id"), nullable=False, index=True)
    referred_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    # "signed_up" → became user; "converted" → paid; "rewarded" → referrer got credit
    status = Column(String(20), default="signed_up", nullable=False)
    reward_cents = Column(Integer, default=0, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    converted_at = Column(DateTime(timezone=True), nullable=True)

    referral_code = relationship("ReferralCode", back_populates="uses")
    referred_user = relationship("User", foreign_keys=[referred_user_id])

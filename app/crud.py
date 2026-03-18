"""
CRUD operations for database models.
All user-scoped operations require user_id.
"""

from datetime import datetime
from typing import Any, List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models import Decision, Insight, Setup, User, NewsItem, DailyBias, UserAction
from app.schemas.decision import DecisionCreate, Insight as InsightSchema


# ---- User ----
def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.query(User).filter(User.google_id == google_id).first()


# ---- Decision ----
def create_decision(db: Session, decision: DecisionCreate, user_id: int) -> Decision:
    db_decision = Decision(
        user_id=user_id,
        mode=decision.mode,
        title=decision.title,
        description=decision.description,
        is_loss=decision.is_loss,
        outcome=decision.outcome,
        trade_data=decision.trade_data.model_dump() if decision.trade_data else None,
        investment_data=decision.investment_data.model_dump() if decision.investment_data else None,
        business_data=decision.business_data.model_dump() if decision.business_data else None,
        personal_data=decision.personal_data.model_dump() if decision.personal_data else None,
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    return db_decision


def get_decision(db: Session, decision_id: int, user_id: int) -> Optional[Decision]:
    return db.query(Decision).filter(Decision.id == decision_id, Decision.user_id == user_id).first()


def get_decisions(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    mode: Optional[str] = None,
    is_loss: Optional[bool] = None,
) -> List[Decision]:
    query = db.query(Decision).filter(Decision.user_id == user_id)
    if mode:
        query = query.filter(Decision.mode == mode)
    if is_loss is not None:
        query = query.filter(Decision.is_loss == is_loss)
    return query.order_by(desc(Decision.created_at)).offset(skip).limit(limit).all()


# ---- Insight ----
def create_insight(db: Session, user_id: int, decision_id: int, insight: InsightSchema) -> Insight:
    db_insight = Insight(
        user_id=user_id,
        decision_id=decision_id,
        mode=insight.mode,
        key_insights=insight.key_insights,
        technical_patterns=insight.technical_patterns,
        psychological_patterns=insight.psychological_patterns,
        mistakes=insight.mistakes,
        strengths=insight.strengths,
        recommendations=insight.recommendations,
        prevention_strategies=insight.prevention_strategies,
        decision_quality_score=insight.decision_quality_score,
        risk_score=insight.risk_score,
        analysis_timestamp=insight.analysis_timestamp or datetime.now(),
    )
    db.add(db_insight)
    db.commit()
    db.refresh(db_insight)
    return db_insight


def get_insight_by_decision(db: Session, decision_id: int, user_id: int) -> Optional[Insight]:
    return (
        db.query(Insight)
        .filter(Insight.decision_id == decision_id, Insight.user_id == user_id)
        .first()
    )


def get_insights(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    mode: Optional[str] = None,
) -> List[Insight]:
    query = db.query(Insight).filter(Insight.user_id == user_id)
    if mode:
        query = query.filter(Insight.mode == mode)
    return query.order_by(desc(Insight.analysis_timestamp)).offset(skip).limit(limit).all()


# ---- Setup ----
def create_setup(db: Session, user_id: int, name: str, description: Optional[str], rules: List[str]) -> Setup:
    s = Setup(user_id=user_id, name=name, description=description, rules=rules)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_setup(db: Session, setup_id: int, user_id: int) -> Optional[Setup]:
    return db.query(Setup).filter(Setup.id == setup_id, Setup.user_id == user_id).first()


def get_setups(db: Session, user_id: int) -> List[Setup]:
    return db.query(Setup).filter(Setup.user_id == user_id).order_by(desc(Setup.created_at)).all()


def update_setup(
    db: Session,
    setup_id: int,
    user_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    rules: Optional[List[str]] = None,
) -> Optional[Setup]:
    s = get_setup(db, setup_id, user_id)
    if not s:
        return None
    if name is not None:
        s.name = name
    if description is not None:
        s.description = description
    if rules is not None:
        s.rules = rules
    db.commit()
    db.refresh(s)
    return s


def delete_setup(db: Session, setup_id: int, user_id: int) -> bool:
    s = get_setup(db, setup_id, user_id)
    if not s:
        return False
    db.delete(s)
    db.commit()
    return True


# ---- News ----
def get_news_last_updated(db: Session) -> Optional[datetime]:
    row = db.query(NewsItem).order_by(desc(NewsItem.fetched_at)).first()
    return row.fetched_at if row else None


def upsert_news(db: Session, items: List[dict]) -> None:
    for item in items:
        published = item.get("published_at")
        if isinstance(published, str):
            try:
                published = datetime.fromisoformat(published)
            except Exception:
                published = None

        n = NewsItem(
            title=item.get("title", ""),
            source=item.get("source", ""),
            url=item.get("url"),
            summary=item.get("summary", ""),
            impact=item.get("impact", "neutral"),
            published_at=published,
        )
        db.add(n)
    db.commit()


def get_news(db: Session, limit: int = 50) -> List[NewsItem]:
    return db.query(NewsItem).order_by(desc(NewsItem.fetched_at)).limit(limit).all()


# ---- DailyBias ----
def get_daily_bias_by_date(db: Session, date: str) -> Optional[DailyBias]:
    return db.query(DailyBias).filter(DailyBias.date == date).first()


def get_daily_bias_latest(db: Session, limit: int = 7) -> List[DailyBias]:
    return db.query(DailyBias).order_by(desc(DailyBias.date)).limit(limit).all()


def create_daily_bias(
    db: Session,
    date: str,
    brief: str,
    warning_zones: Optional[List[str]] = None,
    sentiment: str = "neutral",
) -> DailyBias:
    b = DailyBias(date=date, brief=brief, warning_zones=warning_zones or [], sentiment=sentiment)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


# ---- Trade (Journal) ----
def create_trade(db: Session, trade_data: dict, user_id: int):
    from app.models import Trade
    db_trade = Trade(user_id=user_id, **trade_data)
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade


def get_trade(db: Session, trade_id: int, user_id: int):
    from app.models import Trade
    return db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user_id).first()


def get_trades(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    from app.models import Trade
    return db.query(Trade).filter(Trade.user_id == user_id).order_by(desc(Trade.created_at)).offset(skip).limit(limit).all()


def update_trade(db: Session, trade_id: int, user_id: int, trade_data: dict):
    from app.models import Trade
    db_trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user_id).first()
    if not db_trade:
        return None
    for key, value in trade_data.items():
        if value is not None:
            setattr(db_trade, key, value)
    db.commit()
    db.refresh(db_trade)
    return db_trade


def delete_trade(db: Session, trade_id: int, user_id: int) -> bool:
    from app.models import Trade
    db_trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == user_id).first()
    if not db_trade:
        return False
    db.delete(db_trade)
    db.commit()
    return True


# ---- User Action Logging ----
def log_user_action(
    db: Session,
    user_id: int,
    action_type: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    description: Optional[str] = None,
    action_metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    status: str = "success",
    error_message: Optional[str] = None,
) -> UserAction:
    """Log a user action for audit and analytics."""
    action = UserAction(
        user_id=user_id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        action_metadata=action_metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        error_message=error_message,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def get_user_actions(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
) -> List[UserAction]:
    """Get user actions with optional filtering."""
    query = db.query(UserAction).filter(UserAction.user_id == user_id)
    
    if action_type:
        query = query.filter(UserAction.action_type == action_type)
    if resource_type:
        query = query.filter(UserAction.resource_type == resource_type)
    
    return query.order_by(desc(UserAction.created_at)).offset(skip).limit(limit).all()


def get_user_actions_by_date(
    db: Session,
    user_id: int,
    start_date: datetime,
    end_date: datetime,
) -> List[UserAction]:
    """Get user actions within a date range."""
    return (
        db.query(UserAction)
        .filter(
            UserAction.user_id == user_id,
            UserAction.created_at >= start_date,
            UserAction.created_at <= end_date,
        )
        .order_by(desc(UserAction.created_at))
        .all()
    )


def get_action_stats(db: Session, user_id: int) -> dict:
    """Get user action statistics."""
    from datetime import timedelta
    from sqlalchemy import func
    
    now = datetime.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # Total actions
    total_actions = db.query(func.count(UserAction.id)).filter(
        UserAction.user_id == user_id
    ).scalar() or 0
    
    # Actions today
    actions_today = db.query(func.count(UserAction.id)).filter(
        UserAction.user_id == user_id,
        UserAction.created_at >= today,
    ).scalar() or 0
    
    # Actions this week
    actions_this_week = db.query(func.count(UserAction.id)).filter(
        UserAction.user_id == user_id,
        UserAction.created_at >= week_ago,
    ).scalar() or 0
    
    # Action breakdown by type
    action_breakdown = {}
    breakdown = db.query(UserAction.action_type, func.count(UserAction.id)).filter(
        UserAction.user_id == user_id
    ).group_by(UserAction.action_type).all()
    
    for action_type, count in breakdown:
        action_breakdown[action_type] = count
    
    return {
        "total_actions": total_actions,
        "actions_today": actions_today,
        "actions_this_week": actions_this_week,
        "action_breakdown": action_breakdown,
    }


def get_decisions_by_user(db: Session, user_id: int) -> List[Decision]:
    """Get all decisions for a user."""
    return db.query(Decision).filter(Decision.user_id == user_id).order_by(desc(Decision.created_at)).all()

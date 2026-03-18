"""User action logging endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models import User, UserAction
from app.schemas.user import UserAction as UserActionSchema, UserActionStats
from app.crud import get_user_actions, get_user_actions_by_date, get_action_stats
from app.services.action_logger import ActionLogger
from fastapi import Request

router = APIRouter(prefix="/api/v1", tags=["user-actions"])


@router.get("/user/actions", response_model=List[UserActionSchema])
def get_actions(
    skip: int = 0,
    limit: int = 100,
    action_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's action history."""
    actions = get_user_actions(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        action_type=action_type,
    )
    return actions


@router.get("/user/actions/stats", response_model=UserActionStats)
def get_actions_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user action statistics."""
    stats = get_action_stats(db, current_user.id)
    
    # Get recent actions
    recent = get_user_actions(db, current_user.id, limit=10)
    
    return UserActionStats(
        total_actions=stats["total_actions"],
        actions_today=stats["actions_today"],
        actions_this_week=stats["actions_this_week"],
        recent_actions=recent,
        action_breakdown=stats["action_breakdown"],
    )


@router.get("/user/actions/date-range", response_model=List[UserActionSchema])
def get_actions_by_date(
    start_date: str,  # YYYY-MM-DD
    end_date: str,    # YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user actions within a date range."""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )
    
    actions = get_user_actions_by_date(db, current_user.id, start, end)
    return actions


@router.post("/user/actions/clear")
def clear_actions(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear old actions (keep recent ones)."""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    deleted = (
        db.query(UserAction)
        .filter(
            UserAction.user_id == current_user.id,
            UserAction.created_at < cutoff_date,
        )
        .delete()
    )
    db.commit()
    
    return {"deleted": deleted, "message": f"Deleted {deleted} action(s) older than {days} days"}

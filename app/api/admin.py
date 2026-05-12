"""Admin-only API endpoints. Access restricted to the owner email."""

from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User

ADMIN_EMAIL = "rem.vafin.08@gmail.com"

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ── Auth guard ────────────────────────────────────────────────────────────────

def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.email.strip().lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserRow(BaseModel):
    id: int
    email: str
    name: Optional[str]
    plan: str
    ai_queries_this_month: int
    is_active: bool
    created_at: Optional[datetime]
    plan_expires_at: Optional[datetime]

    model_config = {"from_attributes": True}


class StatsResponse(BaseModel):
    total_users: int
    by_plan: dict[str, int]
    active_users: int


class SetPlanBody(BaseModel):
    plan: Literal["core", "edge", "apex"]
    plan_expires_at: Optional[datetime] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total = db.query(func.count(User.id)).scalar() or 0
    active = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0

    by_plan: dict[str, int] = {}
    rows = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    for plan, cnt in rows:
        by_plan[plan or "core"] = cnt

    return StatsResponse(total_users=total, by_plan=by_plan, active_users=active)


@router.get("/users", response_model=list[UserRow])
def admin_list_users(
    search: str = Query("", description="Filter by email or name"),
    skip: int = 0,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            (func.lower(User.email).like(like)) | (func.lower(User.name).like(like))
        )
    users = q.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserRow.model_validate(u) for u in users]


@router.patch("/users/{user_id}/plan", response_model=UserRow)
def admin_set_plan(
    user_id: int,
    body: SetPlanBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = body.plan
    if body.plan_expires_at is not None:
        user.plan_expires_at = body.plan_expires_at
    elif body.plan == "core":
        user.plan_expires_at = None

    db.commit()
    db.refresh(user)
    return UserRow.model_validate(user)

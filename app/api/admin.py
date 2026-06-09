"""Admin-only API endpoints. Access restricted to the owner email.

Powers the admin panel at /admin:
  • Dashboard metrics (growth, MRR estimate, usage, content counts)
  • User management (plan, ban/unban, reset AI quota, adjust referral credits)
  • Activity log (UserAction audit feed with filters)
  • Promo codes (CRUD) & referral program overview
"""

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import (
    Decision,
    NewsItem,
    PromoCode,
    ReferralCode,
    ReferralUse,
    Setup,
    Trade,
    User,
    UserAction,
)

ADMIN_EMAIL = "rem.vafin.08@gmail.com"

# Monthly list price per plan, in USD cents — used for the MRR estimate.
PLAN_PRICE_CENTS = {"core": 0, "edge": 2900, "apex": 7900}

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ── Auth guard ────────────────────────────────────────────────────────────────

def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.email.strip().lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserRow(BaseModel):
    id: int
    email: str
    name: Optional[str]
    plan: str
    ai_queries_this_month: int
    is_active: bool
    is_onboarded: bool
    referral_credits_cents: int
    created_at: Optional[datetime]
    plan_expires_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TimePoint(BaseModel):
    date: str   # YYYY-MM-DD
    count: int


class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    banned_users: int
    by_plan: dict[str, int]
    new_users_today: int
    new_users_7d: int
    new_users_30d: int
    mrr_cents: int
    paying_users: int
    ai_queries_month: int
    actions_today: int
    total_decisions: int
    total_trades: int
    total_setups: int
    total_news: int
    referral_signups: int
    referral_earned_cents: int
    active_promos: int
    signups_30d: list[TimePoint]


class UserDetail(BaseModel):
    user: UserRow
    decisions: int
    trades: int
    setups: int
    actions: int
    referral_code: Optional[str]
    referral_signups: int
    referral_earned_cents: int
    recent_actions: list["ActionRow"]


class ActionRow(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    action_type: str
    resource_type: Optional[str]
    description: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PromoRow(BaseModel):
    id: int
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    applies_to: Optional[str]
    billing_cycle: Optional[str]
    max_uses: Optional[int]
    uses_count: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ReferralRow(BaseModel):
    code: str
    user_id: int
    user_email: Optional[str]
    total_clicks: int
    total_signups: int
    total_conversions: int
    total_earned_cents: int
    created_at: Optional[datetime]


UserDetail.model_rebuild()  # resolve forward ref to ActionRow


# ── Mutation bodies ───────────────────────────────────────────────────────────

class SetPlanBody(BaseModel):
    plan: Literal["core", "edge", "apex"]
    plan_expires_at: Optional[datetime] = None


class SetActiveBody(BaseModel):
    is_active: bool


class AdjustCreditsBody(BaseModel):
    delta_cents: int   # may be negative


class PromoCreateBody(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: Literal["percent", "fixed"] = "percent"
    discount_value: float
    applies_to: Optional[Literal["edge", "apex"]] = None
    billing_cycle: Optional[Literal["monthly", "annual"]] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None


class PromoUpdateBody(BaseModel):
    description: Optional[str] = None
    discount_value: Optional[float] = None
    max_uses: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    now = _utcnow()
    total = db.query(func.count(User.id)).scalar() or 0
    active = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    banned = total - active

    by_plan: dict[str, int] = {"core": 0, "edge": 0, "apex": 0}
    for plan, cnt in db.query(User.plan, func.count(User.id)).group_by(User.plan).all():
        by_plan[plan or "core"] = cnt

    def signups_since(delta: timedelta) -> int:
        return (
            db.query(func.count(User.id))
            .filter(User.created_at >= now - delta)
            .scalar()
            or 0
        )

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0

    # MRR estimate from active paying subscribers at list price.
    paying = 0
    mrr = 0
    for plan in ("edge", "apex"):
        cnt = (
            db.query(func.count(User.id))
            .filter(User.is_active.is_(True), User.plan == plan)
            .scalar()
            or 0
        )
        paying += cnt
        mrr += cnt * PLAN_PRICE_CENTS[plan]

    ai_month = db.query(func.coalesce(func.sum(User.ai_queries_this_month), 0)).scalar() or 0
    actions_today = (
        db.query(func.count(UserAction.id)).filter(UserAction.created_at >= today_start).scalar() or 0
    )

    ref_signups = db.query(func.coalesce(func.sum(ReferralCode.total_signups), 0)).scalar() or 0
    ref_earned = db.query(func.coalesce(func.sum(ReferralCode.total_earned_cents), 0)).scalar() or 0
    active_promos = db.query(func.count(PromoCode.id)).filter(PromoCode.is_active.is_(True)).scalar() or 0

    # 30-day signup time-series, bucketed in Python for DB portability.
    buckets: dict[str, int] = {}
    for i in range(30):
        d = (today_start - timedelta(days=29 - i)).strftime("%Y-%m-%d")
        buckets[d] = 0
    rows = (
        db.query(User.created_at)
        .filter(User.created_at >= today_start - timedelta(days=29))
        .all()
    )
    for (created,) in rows:
        if created is None:
            continue
        key = created.strftime("%Y-%m-%d")
        if key in buckets:
            buckets[key] += 1

    return StatsResponse(
        total_users=total,
        active_users=active,
        banned_users=banned,
        by_plan=by_plan,
        new_users_today=new_today,
        new_users_7d=signups_since(timedelta(days=7)),
        new_users_30d=signups_since(timedelta(days=30)),
        mrr_cents=mrr,
        paying_users=paying,
        ai_queries_month=int(ai_month),
        actions_today=actions_today,
        total_decisions=db.query(func.count(Decision.id)).scalar() or 0,
        total_trades=db.query(func.count(Trade.id)).scalar() or 0,
        total_setups=db.query(func.count(Setup.id)).scalar() or 0,
        total_news=db.query(func.count(NewsItem.id)).scalar() or 0,
        referral_signups=int(ref_signups),
        referral_earned_cents=int(ref_earned),
        active_promos=active_promos,
        signups_30d=[TimePoint(date=d, count=c) for d, c in buckets.items()],
    )


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserRow])
def admin_list_users(
    search: str = Query("", description="Filter by email or name"),
    plan: Optional[str] = Query(None),
    status: Optional[Literal["active", "banned"]] = Query(None),
    sort: Literal["recent", "queries", "name"] = "recent",
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
    if plan:
        q = q.filter(User.plan == plan)
    if status == "active":
        q = q.filter(User.is_active.is_(True))
    elif status == "banned":
        q = q.filter(User.is_active.is_(False))

    if sort == "queries":
        q = q.order_by(User.ai_queries_this_month.desc())
    elif sort == "name":
        q = q.order_by(func.lower(User.name))
    else:
        q = q.order_by(User.created_at.desc())

    users = q.offset(skip).limit(limit).all()
    return [UserRow.model_validate(u) for u in users]


@router.get("/users/{user_id}", response_model=UserDetail)
def admin_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ref = db.query(ReferralCode).filter(ReferralCode.user_id == user_id).first()
    recent = (
        db.query(UserAction)
        .filter(UserAction.user_id == user_id)
        .order_by(UserAction.created_at.desc())
        .limit(20)
        .all()
    )

    return UserDetail(
        user=UserRow.model_validate(user),
        decisions=db.query(func.count(Decision.id)).filter(Decision.user_id == user_id).scalar() or 0,
        trades=db.query(func.count(Trade.id)).filter(Trade.user_id == user_id).scalar() or 0,
        setups=db.query(func.count(Setup.id)).filter(Setup.user_id == user_id).scalar() or 0,
        actions=db.query(func.count(UserAction.id)).filter(UserAction.user_id == user_id).scalar() or 0,
        referral_code=ref.code if ref else None,
        referral_signups=ref.total_signups if ref else 0,
        referral_earned_cents=ref.total_earned_cents if ref else 0,
        recent_actions=[ActionRow.model_validate(a) for a in recent],
    )


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


@router.patch("/users/{user_id}/active", response_model=UserRow)
def admin_set_active(
    user_id: int,
    body: SetActiveBody,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id and not body.is_active:
        raise HTTPException(status_code=400, detail="You can't ban yourself")

    user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return UserRow.model_validate(user)


@router.post("/users/{user_id}/reset-quota", response_model=UserRow)
def admin_reset_quota(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.ai_queries_this_month = 0
    user.ai_quota_reset_at = _utcnow()
    db.commit()
    db.refresh(user)
    return UserRow.model_validate(user)


@router.post("/users/{user_id}/credits", response_model=UserRow)
def admin_adjust_credits(
    user_id: int,
    body: AdjustCreditsBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.referral_credits_cents = max(0, (user.referral_credits_cents or 0) + body.delta_cents)
    db.commit()
    db.refresh(user)
    return UserRow.model_validate(user)


# ── Activity log ──────────────────────────────────────────────────────────────

@router.get("/activity", response_model=list[ActionRow])
def admin_activity(
    action_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[Literal["success", "error"]] = Query(None),
    search: str = Query(""),
    skip: int = 0,
    limit: int = Query(100, le=300),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(UserAction, User.email).outerjoin(User, User.id == UserAction.user_id)
    if action_type:
        q = q.filter(UserAction.action_type == action_type)
    if user_id:
        q = q.filter(UserAction.user_id == user_id)
    if status:
        q = q.filter(UserAction.status == status)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            func.lower(UserAction.description).like(like)
            | func.lower(UserAction.action_type).like(like)
        )

    rows = q.order_by(UserAction.created_at.desc()).offset(skip).limit(limit).all()
    out: list[ActionRow] = []
    for action, email in rows:
        row = ActionRow.model_validate(action)
        row.user_email = email
        out.append(row)
    return out


@router.get("/activity/types", response_model=list[str])
def admin_activity_types(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.query(UserAction.action_type).distinct().all()
    return sorted({r[0] for r in rows if r[0]})


# ── Promo codes ───────────────────────────────────────────────────────────────

@router.get("/promos", response_model=list[PromoRow])
def admin_list_promos(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.query(PromoCode).order_by(PromoCode.created_at.desc()).all()
    return [PromoRow.model_validate(p) for p in rows]


@router.post("/promos", response_model=PromoRow, status_code=201)
def admin_create_promo(
    body: PromoCreateBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code required")
    if db.query(PromoCode).filter(func.upper(PromoCode.code) == code).first():
        raise HTTPException(status_code=409, detail="Code already exists")

    promo = PromoCode(
        code=code,
        description=body.description,
        discount_type=body.discount_type,
        discount_value=body.discount_value,
        applies_to=body.applies_to,
        billing_cycle=body.billing_cycle,
        max_uses=body.max_uses,
        expires_at=body.expires_at,
        is_active=True,
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return PromoRow.model_validate(promo)


@router.patch("/promos/{promo_id}", response_model=PromoRow)
def admin_update_promo(
    promo_id: int,
    body: PromoUpdateBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(promo, field, value)
    db.commit()
    db.refresh(promo)
    return PromoRow.model_validate(promo)


@router.delete("/promos/{promo_id}", status_code=204)
def admin_delete_promo(
    promo_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promo not found")
    db.delete(promo)
    db.commit()


# ── Referrals ─────────────────────────────────────────────────────────────────

@router.get("/referrals", response_model=list[ReferralRow])
def admin_referrals(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(ReferralCode, User.email)
        .outerjoin(User, User.id == ReferralCode.user_id)
        .order_by(ReferralCode.total_earned_cents.desc(), ReferralCode.total_signups.desc())
        .limit(200)
        .all()
    )
    return [
        ReferralRow(
            code=rc.code,
            user_id=rc.user_id,
            user_email=email,
            total_clicks=rc.total_clicks,
            total_signups=rc.total_signups,
            total_conversions=rc.total_conversions,
            total_earned_cents=rc.total_earned_cents,
            created_at=rc.created_at,
        )
        for rc, email in rows
    ]

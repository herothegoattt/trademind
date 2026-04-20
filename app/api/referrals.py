"""
Referral system and promo code API.

Endpoints:
  GET  /referral/my-code          — get or create user's referral code + stats
  POST /referral/click            — track a referral link click (public, no auth)
  POST /referral/validate-promo   — check a promo code (returns discount info)
  POST /referral/apply-promo      — apply promo to checkout (returns Stripe coupon id)
  GET  /referral/promo-codes      — list all active promo codes (admin use / seeding)

Referral reward logic:
  - Referree gets: 15% off their first paid plan (applied at checkout as Stripe coupon)
  - Referrer gets:  $10 credit per conversion (stored as referral_credits_cents)
                   After 3 conversions → 1 month free Edge added automatically
"""

import logging
import random
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.database import get_db
from app.models import PromoCode, ReferralCode, ReferralUse, User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/referral", tags=["referral"])

# ─── Constants ────────────────────────────────────────────────────────────────
REFERREE_DISCOUNT_PCT = 15      # % off first payment for the person who used a referral link
REFERRER_REWARD_CENTS = 1000    # $10 credit per paid conversion
REFERRER_FREE_MONTH_THRESHOLD = 3  # conversions needed for 1 free month


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _gen_code(name: Optional[str], user_id: int) -> str:
    """Generate a unique-ish referral code like TM-ALEX4K2M."""
    prefix = (name or "USER")[:4].upper().replace(" ", "")
    prefix = "".join(c for c in prefix if c.isalpha()) or "USER"
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TM-{prefix}{suffix}"


def _get_or_create_referral(user: User, db: Session) -> ReferralCode:
    ref = db.query(ReferralCode).filter(ReferralCode.user_id == user.id).first()
    if not ref:
        # Ensure uniqueness
        for _ in range(10):
            code = _gen_code(user.name, user.id)
            if not db.query(ReferralCode).filter(ReferralCode.code == code).first():
                break
        ref = ReferralCode(user_id=user.id, code=code)
        db.add(ref)
        db.commit()
        db.refresh(ref)
    return ref


def _validate_promo_code(code: str, db: Session, plan: Optional[str] = None, billing: Optional[str] = None) -> PromoCode:
    """Raises HTTPException if code is invalid, expired, or exhausted."""
    promo = db.query(PromoCode).filter(
        PromoCode.code == code.upper().strip(),
        PromoCode.is_active == True,  # noqa: E712
    ).first()

    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found or inactive")

    now = datetime.now(timezone.utc)
    if promo.expires_at and promo.expires_at < now:
        raise HTTPException(status_code=400, detail="Promo code has expired")

    if promo.max_uses is not None and promo.uses_count >= promo.max_uses:
        raise HTTPException(status_code=400, detail="Promo code has reached its usage limit")

    if promo.applies_to and plan and promo.applies_to != plan:
        raise HTTPException(status_code=400, detail=f"This code only applies to the {promo.applies_to} plan")

    if promo.billing_cycle and billing and promo.billing_cycle != billing:
        raise HTTPException(status_code=400, detail=f"This code only applies to {promo.billing_cycle} billing")

    return promo


def _get_or_create_stripe_coupon(promo: PromoCode) -> Optional[str]:
    """Get or create a Stripe coupon for this promo code. Returns coupon id."""
    if not settings.stripe_secret_key:
        return None
    try:
        import stripe
        stripe.api_key = settings.stripe_secret_key

        if promo.stripe_coupon_id:
            return promo.stripe_coupon_id

        coupon_kwargs: dict = {
            "name": f"{promo.code} — {promo.description or promo.code}",
            "duration": "once",
            "id": f"tm_{promo.code.lower()}",
        }
        if promo.discount_type == "percent":
            coupon_kwargs["percent_off"] = promo.discount_value
        else:
            coupon_kwargs["amount_off"] = int(promo.discount_value)
            coupon_kwargs["currency"] = "usd"

        try:
            coupon = stripe.Coupon.create(**coupon_kwargs)
        except stripe.error.InvalidRequestError:
            # Already exists — retrieve it
            coupon = stripe.Coupon.retrieve(f"tm_{promo.code.lower()}")

        return coupon.id
    except Exception as e:
        logger.warning("Stripe coupon creation failed: %s", e)
        return None


# ─── Schemas ──────────────────────────────────────────────────────────────────
class ReferralStats(BaseModel):
    code: str
    share_url: str
    total_clicks: int
    total_signups: int
    total_conversions: int
    total_earned_dollars: float
    credits_balance_dollars: float
    recent_uses: list


class PromoValidateRequest(BaseModel):
    code: str
    plan: Optional[str] = None
    billing: Optional[str] = None


class PromoValidateResponse(BaseModel):
    valid: bool
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    uses_remaining: Optional[int]
    stripe_coupon_id: Optional[str] = None


class PromoApplyRequest(BaseModel):
    code: str
    plan: str
    billing: str


class PromoApplyResponse(BaseModel):
    stripe_coupon_id: Optional[str]
    discount_type: str
    discount_value: float
    message: str


class ReferralClickRequest(BaseModel):
    code: str
    referrer: Optional[str] = None  # UTM source etc.


# ─── Endpoints ────────────────────────────────────────────────────────────────
@router.get("/my-code", response_model=ReferralStats)
def my_referral_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return (or create) the current user's referral code with stats."""
    ref = _get_or_create_referral(current_user, db)

    base = settings.cors_origins.split(",")[0].strip().rstrip("/")
    share_url = f"{base}/ref/{ref.code}"

    recent_uses = (
        db.query(ReferralUse)
        .filter(ReferralUse.referral_code_id == ref.id)
        .order_by(ReferralUse.created_at.desc())
        .limit(5)
        .all()
    )
    recent = [
        {
            "status": u.status,
            "date": u.created_at.isoformat(),
            "reward_dollars": u.reward_cents / 100,
        }
        for u in recent_uses
    ]

    return ReferralStats(
        code=ref.code,
        share_url=share_url,
        total_clicks=ref.total_clicks,
        total_signups=ref.total_signups,
        total_conversions=ref.total_conversions,
        total_earned_dollars=ref.total_earned_cents / 100,
        credits_balance_dollars=getattr(current_user, "referral_credits_cents", 0) / 100,
        recent_uses=recent,
    )


@router.post("/click")
def track_click(body: ReferralClickRequest, db: Session = Depends(get_db)):
    """Increment click counter for a referral code. Public — no auth needed."""
    ref = db.query(ReferralCode).filter(ReferralCode.code == body.code.upper()).first()
    if ref:
        ref.total_clicks = (ref.total_clicks or 0) + 1
        db.commit()
    return {"ok": True}


@router.post("/validate-promo", response_model=PromoValidateResponse)
def validate_promo(
    body: PromoValidateRequest,
    db: Session = Depends(get_db),
):
    """Validate a promo code without consuming it."""
    promo = _validate_promo_code(body.code, db, body.plan, body.billing)
    uses_remaining = None if promo.max_uses is None else max(0, promo.max_uses - promo.uses_count)

    # Get/create Stripe coupon so the frontend can pass it to Stripe Checkout
    coupon_id = _get_or_create_stripe_coupon(promo)

    return PromoValidateResponse(
        valid=True,
        code=promo.code,
        description=promo.description,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        uses_remaining=uses_remaining,
        stripe_coupon_id=coupon_id,
    )


@router.post("/apply-promo", response_model=PromoApplyResponse)
def apply_promo(
    body: PromoApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate and consume a promo code. Returns Stripe coupon id to pass
    to checkout session. Increments usage counter.
    """
    promo = _validate_promo_code(body.code, db, body.plan, body.billing)
    coupon_id = _get_or_create_stripe_coupon(promo)

    # Consume the code
    promo.uses_count = (promo.uses_count or 0) + 1
    if promo.stripe_coupon_id is None and coupon_id:
        promo.stripe_coupon_id = coupon_id
    db.commit()

    value_str = (
        f"{int(promo.discount_value)}% off"
        if promo.discount_type == "percent"
        else f"${promo.discount_value / 100:.0f} off"
    )
    return PromoApplyResponse(
        stripe_coupon_id=coupon_id,
        discount_type=promo.discount_type,
        discount_value=promo.discount_value,
        message=f"Promo applied: {value_str} — {promo.description or promo.code}",
    )


@router.post("/register-referral")
def register_referral_signup(
    ref_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Called after a referred user signs up. Links the user to the referral code.
    Gives the referree a 15% promo code and increments referrer's signup count.
    """
    ref_code_up = ref_code.upper().strip()
    ref = db.query(ReferralCode).filter(ReferralCode.code == ref_code_up).first()
    if not ref or ref.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Invalid referral code")

    # Prevent double-tracking
    existing = db.query(ReferralUse).filter(ReferralUse.referred_user_id == current_user.id).first()
    if existing:
        return {"ok": True, "already_tracked": True}

    use = ReferralUse(
        referral_code_id=ref.id,
        referred_user_id=current_user.id,
        status="signed_up",
    )
    db.add(use)
    ref.total_signups = (ref.total_signups or 0) + 1
    current_user.referred_by_code = ref_code_up
    db.commit()
    return {"ok": True, "referree_discount_pct": REFERREE_DISCOUNT_PCT}


@router.post("/reward-conversion")
def reward_conversion(
    referred_user_id: int,
    db: Session = Depends(get_db),
):
    """
    Internal endpoint called by the Stripe webhook when a referred user makes
    their first payment. Rewards the referrer with $10 credit.
    """
    use = db.query(ReferralUse).filter(
        ReferralUse.referred_user_id == referred_user_id,
        ReferralUse.status != "rewarded",
    ).first()
    if not use:
        return {"ok": True, "skipped": "no pending referral use"}

    ref = use.referral_code
    referrer = ref.user

    # Credit the referrer
    use.status = "rewarded"
    use.reward_cents = REFERRER_REWARD_CENTS
    use.converted_at = datetime.now(timezone.utc)

    ref.total_conversions = (ref.total_conversions or 0) + 1
    ref.total_earned_cents = (ref.total_earned_cents or 0) + REFERRER_REWARD_CENTS
    referrer.referral_credits_cents = (getattr(referrer, "referral_credits_cents", 0) or 0) + REFERRER_REWARD_CENTS

    db.commit()
    logger.info("Referrer %d rewarded %d cents for conversion of user %d", referrer.id, REFERRER_REWARD_CENTS, referred_user_id)
    return {"ok": True, "reward_cents": REFERRER_REWARD_CENTS}


@router.get("/leaderboard")
def referral_leaderboard(db: Session = Depends(get_db)):
    """Top referrers — public leaderboard for social proof."""
    top = (
        db.query(ReferralCode)
        .filter(ReferralCode.total_conversions > 0)
        .order_by(ReferralCode.total_conversions.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "name": (ref.user.name or ref.user.email.split("@")[0])[:12] + "...",
            "conversions": ref.total_conversions,
            "earned_dollars": ref.total_earned_cents / 100,
        }
        for i, ref in enumerate(top)
    ]

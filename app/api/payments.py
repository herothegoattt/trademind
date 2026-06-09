"""
Stripe payment routes: checkout session creation and webhook handler.

Environment variables required:
  STRIPE_SECRET_KEY          — your Stripe secret key (sk_live_... or sk_test_...)
  STRIPE_WEBHOOK_SECRET      — webhook signing secret from Stripe Dashboard
  STRIPE_PRICE_EDGE_MONTHLY  — Stripe Price ID for Edge monthly
  STRIPE_PRICE_EDGE_ANNUAL   — Stripe Price ID for Edge annual
  STRIPE_PRICE_APEX_MONTHLY  — Stripe Price ID for Apex monthly
  STRIPE_PRICE_APEX_ANNUAL   — Stripe Price ID for Apex annual

Stripe webhook events handled:
  checkout.session.completed       — activate subscription after payment
  customer.subscription.updated    — plan change / renewal
  customer.subscription.deleted    — cancel / downgrade to core
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["payments"])

# ─── Plan → price-ID mapping ──────────────────────────────────────────────────
def _price_id(plan: str, billing: str) -> Optional[str]:
    mapping = {
        ("edge", "monthly"): settings.stripe_price_edge_monthly,
        ("edge", "annual"):  settings.stripe_price_edge_annual,
        ("apex", "monthly"): settings.stripe_price_apex_monthly,
        ("apex", "annual"):  settings.stripe_price_apex_annual,
    }
    return mapping.get((plan, billing))


# ─── Schemas ──────────────────────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    plan: str                    # "edge" | "apex"
    billing: str                 # "monthly" | "annual"
    success_url: str
    cancel_url: str
    coupon_id: Optional[str] = None   # Stripe coupon ID from promo validation


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


# ─── Create Checkout Session ──────────────────────────────────────────────────
@router.post("/payments/create-checkout-session", response_model=CheckoutResponse)
def create_checkout_session(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for plan upgrade."""
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment system not configured",
        )

    try:
        import stripe
        stripe.api_key = settings.stripe_secret_key
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe library not installed",
        )

    price_id = _price_id(body.plan, body.billing)
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Price ID not configured for {body.plan}/{body.billing}",
        )

    # Get or create Stripe customer
    customer_id = getattr(current_user, "stripe_customer_id", None)
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.name or current_user.email,
            metadata={"user_id": str(current_user.id)},
        )
        current_user.stripe_customer_id = customer.id
        db.commit()
        customer_id = customer.id

    session_kwargs: dict = dict(
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        subscription_data={
            "metadata": {
                "user_id": str(current_user.id),
                "plan": body.plan,
            }
        },
        metadata={
            "user_id": str(current_user.id),
            "plan": body.plan,
            "billing": body.billing,
        },
        allow_promotion_codes=not bool(body.coupon_id),  # disable code entry if already applied
    )
    if body.coupon_id:
        session_kwargs["discounts"] = [{"coupon": body.coupon_id}]

    session = stripe.checkout.Session.create(**session_kwargs)

    return CheckoutResponse(checkout_url=session.url, session_id=session.id)


# ─── Customer portal (manage / cancel) ───────────────────────────────────────
class PortalResponse(BaseModel):
    portal_url: str


@router.post("/payments/customer-portal", response_model=PortalResponse)
def customer_portal(
    return_url: str,
    current_user: User = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session to manage subscription."""
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

    customer_id = getattr(current_user, "stripe_customer_id", None)
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return PortalResponse(portal_url=session.url)


# ─── Confirm / sync (post-checkout, webhook-independent) ─────────────────────
class ConfirmRequest(BaseModel):
    session_id: Optional[str] = None


class ConfirmResponse(BaseModel):
    plan: str
    plan_expires_at: Optional[datetime] = None
    activated: bool


@router.post("/payments/confirm", response_model=ConfirmResponse)
def confirm_subscription(
    body: Optional[ConfirmRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authoritatively sync the caller's plan from Stripe right after they return
    from Checkout, so unlocking never depends on the async webhook landing first
    (a common cause of "paid but still locked"). Idempotent — safe to call on
    every return and to poll.
    """
    current_plan = getattr(current_user, "plan", "core") or "core"
    current_exp = getattr(current_user, "plan_expires_at", None)

    if not settings.stripe_secret_key:
        return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=False)

    import stripe
    stripe.api_key = settings.stripe_secret_key

    session_id = body.session_id if body else None
    customer_id = getattr(current_user, "stripe_customer_id", None)
    plan_hint: Optional[str] = None
    sub = None

    try:
        if session_id:
            sess = stripe.checkout.Session.retrieve(session_id, expand=["subscription"])
            owner = sess.get("metadata", {}).get("user_id")
            if owner not in (None, str(current_user.id)):
                raise HTTPException(status_code=403, detail="Checkout session does not belong to this user")
            if sess.get("payment_status") not in ("paid", "no_payment_required"):
                return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=False)
            plan_hint = sess.get("metadata", {}).get("plan")
            customer_id = sess.get("customer") or customer_id
            sub_obj = sess.get("subscription")
            if isinstance(sub_obj, str):
                sub = stripe.Subscription.retrieve(sub_obj)
            elif isinstance(sub_obj, dict):
                sub = sub_obj
        if sub is None and customer_id:
            subs = stripe.Subscription.list(customer=customer_id, status="active", limit=1)
            data = subs.get("data", [])
            if data:
                sub = data[0]
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001 — Stripe lookup is best-effort
        logger.warning("confirm_subscription: Stripe lookup failed for user %d: %s", current_user.id, e)
        sub = None

    if sub is None:
        return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=False)

    plan = plan_hint or sub.get("metadata", {}).get("plan") or _plan_from_subscription(sub) or "edge"
    current_user.plan = plan
    current_user.stripe_subscription_id = sub.get("id")
    if customer_id and not getattr(current_user, "stripe_customer_id", None):
        current_user.stripe_customer_id = customer_id
    period_end = sub.get("current_period_end")
    if period_end:
        current_user.plan_expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc)
    db.commit()
    db.refresh(current_user)
    logger.info("confirm_subscription: user %d synced to plan=%s", current_user.id, plan)
    return ConfirmResponse(
        plan=plan,
        plan_expires_at=getattr(current_user, "plan_expires_at", None),
        activated=plan != "core",
    )


# ─── Webhook ──────────────────────────────────────────────────────────────────
@router.post("/payments/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.
    Must be registered in Stripe Dashboard pointing to /api/v1/payments/webhook.
    """
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payment system not configured")

    import stripe
    stripe.api_key = settings.stripe_secret_key

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user = _handle_checkout_completed(db, data)
        # Trigger referral reward if this user was referred
        if user:
            _maybe_reward_referral(db, user)

    elif event_type in ("customer.subscription.updated", "invoice.payment_succeeded"):
        _handle_subscription_updated(db, data)

    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data)

    return {"received": True}


# ─── Webhook helpers ──────────────────────────────────────────────────────────
def _get_user_by_customer(db: Session, customer_id: str) -> Optional[User]:
    return db.query(User).filter(User.stripe_customer_id == customer_id).first()


def _handle_checkout_completed(db: Session, session) -> Optional[User]:
    """Activate plan after successful checkout. Returns the user."""
    customer_id = session.get("customer")
    metadata = session.get("metadata", {})
    plan = metadata.get("plan", "edge")
    user_id = metadata.get("user_id")

    user = None
    if customer_id:
        user = _get_user_by_customer(db, customer_id)
    if not user and user_id:
        user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        logger.warning("checkout.session.completed: user not found for customer %s", customer_id)
        return None

    subscription_id = session.get("subscription")
    user.plan = plan
    user.stripe_subscription_id = subscription_id
    if customer_id and not user.stripe_customer_id:
        user.stripe_customer_id = customer_id
    db.commit()
    logger.info("User %d upgraded to plan=%s", user.id, plan)
    return user


def _maybe_reward_referral(db: Session, user: User) -> None:
    """If this user was referred, reward the referrer with credit."""
    from app.models import ReferralCode, ReferralUse
    referred_by = getattr(user, "referred_by_code", None)
    if not referred_by:
        return
    try:
        ref = db.query(ReferralCode).filter(ReferralCode.code == referred_by).first()
        if not ref:
            return
        use = db.query(ReferralUse).filter(
            ReferralUse.referred_user_id == user.id,
            ReferralUse.status != "rewarded",
        ).first()
        if not use:
            return
        REWARD_CENTS = 1000  # $10
        use.status = "rewarded"
        use.reward_cents = REWARD_CENTS
        use.converted_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
        ref.total_conversions = (ref.total_conversions or 0) + 1
        ref.total_earned_cents = (ref.total_earned_cents or 0) + REWARD_CENTS
        referrer = db.query(User).filter(User.id == ref.user_id).first()
        if referrer:
            referrer.referral_credits_cents = (getattr(referrer, "referral_credits_cents", 0) or 0) + REWARD_CENTS
        db.commit()
        logger.info("Referral reward: %d cents credited to user %d", REWARD_CENTS, ref.user_id)
    except Exception as e:
        logger.warning("Referral reward failed: %s", e)


def _handle_subscription_updated(db: Session, obj):
    """Update plan status on renewal or plan change."""
    import stripe as _stripe
    _stripe.api_key = settings.stripe_secret_key

    # obj may be a subscription or an invoice
    if obj.get("object") == "invoice":
        sub_id = obj.get("subscription")
        if not sub_id:
            return
        try:
            sub = _stripe.Subscription.retrieve(sub_id)
        except Exception:
            return
    else:
        sub = obj

    customer_id = sub.get("customer")
    user = _get_user_by_customer(db, customer_id)
    if not user:
        return

    plan = sub.get("metadata", {}).get("plan") or _plan_from_subscription(sub)
    if plan:
        user.plan = plan

    # Update expiry from current_period_end
    period_end = sub.get("current_period_end")
    if period_end:
        user.plan_expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc)

    user.stripe_subscription_id = sub.get("id")
    db.commit()


def _handle_subscription_deleted(db: Session, sub):
    """Downgrade to core when subscription is cancelled."""
    customer_id = sub.get("customer")
    user = _get_user_by_customer(db, customer_id)
    if not user:
        return
    user.plan = "core"
    user.stripe_subscription_id = None
    user.plan_expires_at = None
    db.commit()
    logger.info("User %d downgraded to core after subscription cancellation", user.id)


def _plan_from_subscription(sub) -> Optional[str]:
    """Infer plan name from Stripe subscription price IDs."""
    price_map = {
        settings.stripe_price_edge_monthly: "edge",
        settings.stripe_price_edge_annual: "edge",
        settings.stripe_price_apex_monthly: "apex",
        settings.stripe_price_apex_annual: "apex",
    }
    items = sub.get("items", {}).get("data", [])
    for item in items:
        price_id = item.get("price", {}).get("id")
        if price_id and price_id in price_map:
            return price_map[price_id]
    return None

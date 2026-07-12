"""
Lemon Squeezy payment routes: checkout creation and webhook handler.

Environment variables required:
  LEMONSQUEEZY_API_KEY           — your Lemon Squeezy API key
  LEMONSQUEEZY_STORE_ID          — your store ID
  LEMONSQUEEZY_WEBHOOK_SECRET    — webhook signing secret from Lemon Squeezy Dashboard
  LS_VARIANT_EDGE_MONTHLY        — Variant ID for Edge monthly
  LS_VARIANT_EDGE_ANNUAL         — Variant ID for Edge annual
  LS_VARIANT_APEX_MONTHLY        — Variant ID for Apex monthly
  LS_VARIANT_APEX_ANNUAL         — Variant ID for Apex annual

Lemon Squeezy webhook events handled:
  order_created             — activate subscription after payment (one-time)
  subscription_created      — activate plan on first subscription payment
  subscription_updated      — plan change / renewal
  subscription_cancelled    — cancel / downgrade to core
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/v1", tags=["payments"])

LS_API_BASE = "https://api.lemonsqueezy.com/v1"

# ─── Plan → variant-ID mapping ────────────────────────────────────────────────
def _variant_id(plan: str, billing: str) -> Optional[str]:
    mapping = {
        ("edge", "monthly"): settings.ls_variant_edge_monthly,
        ("edge", "annual"):  settings.ls_variant_edge_annual,
        ("apex", "monthly"): settings.ls_variant_apex_monthly,
        ("apex", "annual"):  settings.ls_variant_apex_annual,
    }
    return mapping.get((plan, billing))


# ─── Schemas ──────────────────────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    plan: str                    # "edge" | "apex"
    billing: str                 # "monthly" | "annual"
    success_url: str
    cancel_url: str


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
    """Create a Lemon Squeezy checkout session for plan upgrade."""
    if not settings.lemonsqueezy_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment system not configured",
        )

    variant_id = _variant_id(body.plan, body.billing)
    if not variant_id:
        if body.billing == "annual":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Annual billing is not yet available. Please select monthly.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{body.plan.title()} plan is not yet available. Please check back soon.",
        )

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
    }

    payload = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "product_options": {
                    "enabled_variants": [int(variant_id)],
                    "redirect_url": body.success_url,
                },
                "checkout_data": {
                    "email": current_user.email,
                    "name": current_user.name or current_user.email,
                    "custom": {
                        "user_id": str(current_user.id),
                        "plan": body.plan,
                        "billing": body.billing,
                    },
                },
                "preview": False,
                "test_mode": settings.debug,
            },
            "relationships": {
                "store": {
                    "data": {
                        "type": "stores",
                        "id": str(settings.lemonsqueezy_store_id),
                    },
                },
                "variant": {
                    "data": {
                        "type": "variants",
                        "id": str(variant_id),
                    },
                },
            },
        }
    }

    try:
        resp = httpx.post(
            f"{LS_API_BASE}/checkouts",
            headers=headers,
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        checkout_data = data.get("data", {})
        attributes = checkout_data.get("attributes", {})
        checkout_url = attributes.get("url")
        checkout_id = checkout_data.get("id", "")

        if not checkout_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to create checkout URL",
            )

        return CheckoutResponse(checkout_url=checkout_url, session_id=str(checkout_id))
    except httpx.HTTPStatusError as e:
        logger.error("Lemon Squeezy API error: %s", e.response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider error",
        )
    except httpx.RequestError as e:
        logger.error("Lemon Squeezy request failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider unreachable",
        )


# ─── Confirm subscription (called after checkout redirect) ────────────────────
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
    Check user's current plan status after returning from Lemon Squeezy checkout.
    Since Lemon Squeezy webhooks are async, we trust the plan that was set
    by the webhook. If webhook hasn't arrived yet, we try to fetch recent orders.
    """
    current_plan = getattr(current_user, "plan", "core") or "core"
    current_exp = getattr(current_user, "plan_expires_at", None)

    if not settings.lemonsqueezy_api_key:
        return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=False)

    # If the webhook already updated the user, return immediately
    if current_plan != "core":
        return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=True)

    # Try to fetch recent orders for this user's email from Lemon Squeezy
    try:
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
        }
        resp = httpx.get(
            f"{LS_API_BASE}/orders",
            headers=headers,
            params={"filter[store_id]": settings.lemonsqueezy_store_id, "page[size]": 5},
            timeout=15,
        )
        resp.raise_for_status()
        orders_data = resp.json()

        for order in orders_data.get("data", []):
            attrs = order.get("attributes", {})
            user_email = attrs.get("user_email", "")
            if user_email and user_email.lower() == current_user.email.lower():
                status_ = attrs.get("status", "")
                if status_ == "paid":
                    custom_data = attrs.get("custom_data", {}) or {}
                    plan = custom_data.get("plan", "edge")
                    current_user.plan = plan
                    current_user.stripe_subscription_id = str(order.get("id", ""))
                    db.commit()
                    return ConfirmResponse(plan=plan, plan_expires_at=None, activated=True)
    except Exception as e:
        logger.warning("confirm_subscription: Lemon Squeezy lookup failed: %s", e)

    return ConfirmResponse(plan=current_plan, plan_expires_at=current_exp, activated=False)


# ─── Webhook ──────────────────────────────────────────────────────────────────
@router.post("/payments/webhook")
async def lemonsqueezy_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Lemon Squeezy webhook events.

    Must be registered in Lemon Squeezy Dashboard → Settings → Webhooks
    pointing to https://yourdomain.com/api/v1/payments/webhook

    Events to subscribe to:
      - order_created
      - subscription_created
      - subscription_updated
      - subscription_cancelled
    """
    if not settings.lemonsqueezy_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook secret not configured")

    payload = await request.body()
    signature = request.headers.get("x-signature", "")

    # Verify webhook signature
    secret = settings.lemonsqueezy_webhook_secret.encode("utf-8")
    expected_sig = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_sig, signature):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_name = event.get("meta", {}).get("event_name", "")
    logger.info("Lemon Squeezy webhook: %s", event_name)

    if event_name == "order_created":
        _handle_order_created(db, event)
    elif event_name == "subscription_created":
        _handle_subscription_created(db, event)
    elif event_name == "subscription_updated":
        _handle_subscription_updated(db, event)
    elif event_name == "subscription_cancelled":
        _handle_subscription_cancelled(db, event)
    else:
        logger.info("Unhandled webhook event: %s", event_name)

    return {"received": True}


# ─── Webhook helpers ──────────────────────────────────────────────────────────
def _get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def _get_user_by_id(db: Session, user_id_str: str) -> Optional[User]:
    try:
        return db.query(User).filter(User.id == int(user_id_str)).first()
    except (ValueError, TypeError):
        return None


def _handle_order_created(db: Session, event: dict):
    """Activate plan after one-time payment."""
    data = event.get("data", {})
    attrs = data.get("attributes", {})
    user_email = attrs.get("user_email", "")
    custom_data = attrs.get("custom_data", {}) or {}

    user = _get_user_by_email(db, user_email)
    user_id = custom_data.get("user_id")
    if not user and user_id:
        user = _get_user_by_id(db, user_id)

    if not user:
        logger.warning("order_created: user not found for email=%s user_id=%s", user_email, user_id)
        return

    plan = custom_data.get("plan", "edge")
    user.plan = plan
    user.stripe_subscription_id = str(data.get("id", ""))
    db.commit()
    logger.info("User %d upgraded to plan=%s via order", user.id, plan)


def _handle_subscription_created(db: Session, event: dict):
    """Activate plan when a subscription is created."""
    data = event.get("data", {})
    attrs = data.get("attributes", {})
    user_email = attrs.get("user_email", "")
    custom_data = attrs.get("custom_data", {}) or {}

    user = _get_user_by_email(db, user_email)
    user_id = custom_data.get("user_id")
    if not user and user_id:
        user = _get_user_by_id(db, user_id)

    if not user:
        logger.warning("subscription_created: user not found for email=%s user_id=%s", user_email, user_id)
        return

    plan = custom_data.get("plan", "edge")
    user.plan = plan
    user.stripe_subscription_id = str(data.get("id", ""))

    # Set expiry from subscription data
    attributes = data.get("attributes", {})
    ends_at = attributes.get("ends_at")
    if ends_at:
        try:
            user.plan_expires_at = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pass
    elif attributes.get("renews_at"):
        try:
            user.plan_expires_at = datetime.fromisoformat(attributes["renews_at"].replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            pass

    db.commit()
    logger.info("User %d subscribed to plan=%s (subscription)", user.id, plan)


def _handle_subscription_updated(db: Session, event: dict):
    """Update plan status on renewal or plan change."""
    data = event.get("data", {})
    attrs = data.get("attributes", {})
    user_email = attrs.get("user_email", "")
    custom_data = attrs.get("custom_data", {}) or {}

    user = _get_user_by_email(db, user_email)
    user_id = custom_data.get("user_id")
    if not user and user_id:
        user = _get_user_by_id(db, user_id)

    if not user:
        logger.warning("subscription_updated: user not found for email=%s user_id=%s", user_email, user_id)
        return

    status_ = attrs.get("status", "")
    if status_ in ("active", "on_trial"):
        plan = custom_data.get("plan") or user.plan or "edge"
        user.plan = plan
        user.stripe_subscription_id = str(data.get("id", ""))

        ends_at = attrs.get("ends_at")
        if ends_at:
            try:
                user.plan_expires_at = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                pass
        elif attrs.get("renews_at"):
            try:
                user.plan_expires_at = datetime.fromisoformat(attrs["renews_at"].replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                pass
    elif status_ in ("expired", "cancelled"):
        user.plan = "core"
        user.plan_expires_at = None

    db.commit()
    logger.info("User %d subscription updated — status=%s plan=%s", user.id, status_, user.plan)


def _handle_subscription_cancelled(db: Session, event: dict):
    """Downgrade to core when subscription is cancelled."""
    data = event.get("data", {})
    attrs = data.get("attributes", {})
    user_email = attrs.get("user_email", "")
    custom_data = attrs.get("custom_data", {}) or {}

    user = _get_user_by_email(db, user_email)
    user_id = custom_data.get("user_id")
    if not user and user_id:
        user = _get_user_by_id(db, user_id)

    if not user:
        logger.warning("subscription_cancelled: user not found for email=%s user_id=%s", user_email, user_id)
        return

    user.plan = "core"
    user.stripe_subscription_id = None
    user.plan_expires_at = None
    db.commit()
    logger.info("User %d downgraded to core after subscription cancellation", user.id)

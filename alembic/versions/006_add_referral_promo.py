"""add referral and promo code tables

Revision ID: 006_referral_promo
Revises: 005_subscription
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = "006_referral_promo"
down_revision = "005_subscription"
branch_labels = None
depends_on = None


def upgrade():
    # Add referral fields to users
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("referred_by_code", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("referral_credits_cents", sa.Integer(), nullable=False, server_default="0"))

    # promo_codes
    op.create_table(
        "promo_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(30), unique=True, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("discount_type", sa.String(10), nullable=False, server_default="percent"),
        sa.Column("discount_value", sa.Float(), nullable=False),
        sa.Column("applies_to", sa.String(20), nullable=True),
        sa.Column("billing_cycle", sa.String(10), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stripe_coupon_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_promo_codes_code", "promo_codes", ["code"], unique=True)

    # referral_codes
    op.create_table(
        "referral_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("code", sa.String(20), unique=True, nullable=False),
        sa.Column("total_clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_signups", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_conversions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_earned_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_referral_codes_code", "referral_codes", ["code"], unique=True)
    op.create_index("ix_referral_codes_user_id", "referral_codes", ["user_id"], unique=True)

    # referral_uses
    op.create_table(
        "referral_uses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("referral_code_id", sa.Integer(), sa.ForeignKey("referral_codes.id"), nullable=False),
        sa.Column("referred_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="signed_up"),
        sa.Column("reward_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_referral_uses_referral_code_id", "referral_uses", ["referral_code_id"])

    # Seed early-user promo codes
    op.execute("""
        INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, is_active)
        VALUES
          ('LAUNCH',   'Launch special — 25% off any plan', 'percent', 25, 500, 1),
          ('EARLY50',  'Early user — 50% off first month',  'percent', 50, 100, 1),
          ('TRADEMIND','Welcome gift — 20% off',            'percent', 20, NULL, 1),
          ('VIP30',    'VIP early access — 30% off',        'percent', 30, 50,  1),
          ('ANNUAL20', 'Extra 20% off annual plans',        'percent', 20, NULL, 1)
    """)


def downgrade():
    op.drop_table("referral_uses")
    op.drop_table("referral_codes")
    op.drop_table("promo_codes")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("referred_by_code")
        batch_op.drop_column("referral_credits_cents")

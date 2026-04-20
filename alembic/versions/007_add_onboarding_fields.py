"""add is_onboarded and preferred_market to users

Revision ID: 007_onboarding
Revises: 006_referral_promo
Create Date: 2026-04-17
"""
from alembic import op
import sqlalchemy as sa

revision = "007_onboarding"
down_revision = "006_referral_promo"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_onboarded", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("preferred_market", sa.String(50), nullable=True))


def downgrade():
    op.drop_column("users", "preferred_market")
    op.drop_column("users", "is_onboarded")

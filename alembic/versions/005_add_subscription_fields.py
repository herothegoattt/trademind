"""add subscription fields to users

Revision ID: 005_subscription
Revises: 004_add_user_profile_and_actions
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = "005_subscription"
down_revision = "004_add_user_profile_and_actions"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("plan", sa.String(20), nullable=False, server_default="core"))
        batch_op.add_column(sa.Column("stripe_customer_id", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("plan_expires_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("ai_queries_this_month", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("ai_quota_reset_at", sa.DateTime(timezone=True), nullable=True))
    # unique index on stripe_customer_id
    op.create_index("ix_users_stripe_customer_id", "users", ["stripe_customer_id"], unique=True)


def downgrade():
    op.drop_index("ix_users_stripe_customer_id", table_name="users")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("plan")
        batch_op.drop_column("stripe_customer_id")
        batch_op.drop_column("stripe_subscription_id")
        batch_op.drop_column("plan_expires_at")
        batch_op.drop_column("ai_queries_this_month")
        batch_op.drop_column("ai_quota_reset_at")

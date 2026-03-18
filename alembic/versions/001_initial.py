"""Initial schema: users, decisions, insights, setups, news, daily_bias

Revision ID: 001
Revises:
Create Date: 2025-02-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("google_id", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.create_table(
        "decisions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_loss", sa.Boolean(), server_default="0"),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("trade_data", sa.JSON(), nullable=True),
        sa.Column("investment_data", sa.JSON(), nullable=True),
        sa.Column("business_data", sa.JSON(), nullable=True),
        sa.Column("personal_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_decisions_user_id", "decisions", ["user_id"])
    op.create_index("ix_decisions_mode", "decisions", ["mode"])
    op.create_index("ix_decisions_created_at", "decisions", ["created_at"])

    op.create_table(
        "insights",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("decision_id", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(), nullable=False),
        sa.Column("key_insights", sa.JSON(), nullable=True),
        sa.Column("technical_patterns", sa.JSON(), nullable=True),
        sa.Column("psychological_patterns", sa.JSON(), nullable=True),
        sa.Column("mistakes", sa.JSON(), nullable=True),
        sa.Column("strengths", sa.JSON(), nullable=True),
        sa.Column("recommendations", sa.JSON(), nullable=True),
        sa.Column("prevention_strategies", sa.JSON(), nullable=True),
        sa.Column("decision_quality_score", sa.Float(), nullable=True),
        sa.Column("risk_score", sa.Float(), nullable=True),
        sa.Column("analysis_timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_insights_user_id", "insights", ["user_id"])
    op.create_index("ix_insights_decision_id", "insights", ["decision_id"])

    op.create_table(
        "setups",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rules", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_setups_user_id", "setups", ["user_id"])

    op.create_table(
        "news",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("source", sa.String(255), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("impact", sa.String(32), server_default="neutral"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "daily_bias",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("date", sa.String(10), nullable=False),
        sa.Column("brief", sa.Text(), nullable=False),
        sa.Column("warning_zones", sa.JSON(), nullable=True),
        sa.Column("sentiment", sa.String(32), server_default="neutral"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_daily_bias_date", "daily_bias", ["date"], unique=True)


def downgrade() -> None:
    op.drop_table("daily_bias")
    op.drop_table("news")
    op.drop_table("setups")
    op.drop_table("insights")
    op.drop_table("decisions")
    op.drop_table("users")

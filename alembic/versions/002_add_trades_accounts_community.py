"""Add accounts, trades, community posts/reviews, likes/comments, admin flag on users

Revision ID: 002
Revises: 001
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # add is_admin to users
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), server_default="0"))

    # accounts table
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("base_currency", sa.String(10), nullable=False),
        sa.Column("starting_balance", sa.Numeric(18,4), nullable=False),
        sa.Column("current_balance", sa.Numeric(18,4)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_accounts_user_id", "accounts", ["user_id"])

    # trades table
    op.create_table(
        "trades",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("symbol", sa.String(64), nullable=False),
        sa.Column("asset_class", sa.String(32), nullable=False),
        sa.Column("direction", sa.Enum("long","short", name="directionenum"), nullable=False),
        sa.Column("entry_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("exit_time", sa.DateTime(timezone=True)),
        sa.Column("entry_price", sa.Numeric(20,8), nullable=False),
        sa.Column("exit_price", sa.Numeric(20,8)),
        sa.Column("position_size", sa.Numeric(20,4), nullable=False),
        sa.Column("fees", sa.Numeric(18,4), server_default="0"),
        sa.Column("leverage", sa.Numeric(10,2)),
        sa.Column("stop_loss", sa.Numeric(20,8)),
        sa.Column("take_profit", sa.Numeric(20,8)),
        sa.Column("thesis", sa.String()),
        sa.Column("setup_tags", sa.String()),
        sa.Column("emotions", sa.String()),
        sa.Column("outcome", sa.Enum("win","loss","breakeven", name="outcomeenum")),
        sa.Column("balance_before_trade", sa.Numeric(18,4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_trades_user_id", "trades", ["user_id"])
    op.create_index("ix_trades_account_id", "trades", ["account_id"])
    op.create_index("ix_trades_symbol", "trades", ["symbol"])
    op.create_index("ix_trades_asset_class", "trades", ["asset_class"])

    # community posts
    op.create_table(
        "community_posts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tags", sa.String()),
        sa.Column("symbol", sa.String(20)),
        sa.Column("anonymous", sa.Boolean(), server_default="0"),
        sa.Column("status", sa.Enum("pending","approved","rejected", name="contentstatus"), server_default="pending"),
        sa.Column("moderation_reason", sa.String()),
        sa.Column("reviewed_by_admin_id", sa.Integer()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("flagged", sa.Boolean(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_community_posts_status", "community_posts", ["status"])

    # community reviews
    op.create_table(
        "community_reviews",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("short_title", sa.String(255), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("experience_level", sa.String()),
        sa.Column("anonymous", sa.Boolean(), server_default="0"),
        sa.Column("status", sa.Enum("pending","approved","rejected", name="contentstatus"), server_default="pending"),
        sa.Column("moderation_reason", sa.String()),
        sa.Column("reviewed_by_admin_id", sa.Integer()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_community_reviews_status", "community_reviews", ["status"])

    # likes
    op.create_table(
        "post_likes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_post_likes_post_id", "post_likes", ["post_id"])

    # comments
    op.create_table(
        "post_comments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("anonymous", sa.Boolean(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["post_id"], ["community_posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_post_comments_post_id", "post_comments", ["post_id"])


def downgrade() -> None:
    op.drop_table("post_comments")
    op.drop_table("post_likes")
    op.drop_table("community_reviews")
    op.drop_table("community_posts")
    op.drop_index("ix_trades_asset_class", table_name="trades")
    op.drop_index("ix_trades_symbol", table_name="trades")
    op.drop_index("ix_trades_account_id", table_name="trades")
    op.drop_index("ix_trades_user_id", table_name="trades")
    op.drop_table("trades")
    op.drop_index("ix_accounts_user_id", table_name="accounts")
    op.drop_table("accounts")
    op.drop_column("users", "is_admin")

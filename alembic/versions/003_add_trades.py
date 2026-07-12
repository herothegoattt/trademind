"""Add Trade (journal) table

Revision ID: 003_add_trades
Revises: 002_add_trades_accounts_community
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_trades'
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old trades table from migration 002 before creating new schema
    op.execute("DROP TABLE IF EXISTS trades CASCADE")
    # Create trades table
    op.create_table(
        'trades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(20), nullable=False),
        sa.Column('type', sa.String(10), nullable=False),
        sa.Column('entry', sa.Float(), nullable=False),
        sa.Column('exit', sa.Float(), nullable=True),
        sa.Column('account_size', sa.Float(), nullable=True),
        sa.Column('duration', sa.String(50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('pnl', sa.Float(), nullable=True),
        sa.Column('pnl_percent', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_trades_id', 'id'),
        sa.Index('ix_trades_user_id', 'user_id'),
    )


def downgrade() -> None:
    op.drop_table('trades')

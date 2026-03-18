"""Add user profile fields and user actions table"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_user_profile_and_actions'
down_revision = '003_add_trades'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    
    # Create user_actions table
    op.create_table(
        'user_actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(100), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('action_metadata', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for user_actions
    op.create_index(op.f('ix_user_actions_user_id'), 'user_actions', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_actions_action_type'), 'user_actions', ['action_type'], unique=False)
    op.create_index(op.f('ix_user_actions_created_at'), 'user_actions', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_user_actions_created_at'), table_name='user_actions')
    op.drop_index(op.f('ix_user_actions_action_type'), table_name='user_actions')
    op.drop_index(op.f('ix_user_actions_user_id'), table_name='user_actions')
    
    # Drop user_actions table
    op.drop_table('user_actions')
    
    # Remove columns from users table
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'name')

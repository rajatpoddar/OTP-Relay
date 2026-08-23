"""Add designation and profile_completed to staff, make user fields nullable

Revision ID: add_staff_designation
Revises: add_routing_auth_status
Create Date: 2026-08-23
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_staff_designation'
down_revision = 'add_routing_auth_status'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Staff table: add designation and profile_completed
    op.add_column('staff', sa.Column('designation', sa.String(100), nullable=True))
    op.add_column('staff', sa.Column('profile_completed', sa.Boolean(), nullable=False, server_default='false'))
    
    # User table: make email and hashed_password nullable for STAFF role
    op.alter_column('users', 'email', nullable=True)
    op.alter_column('users', 'hashed_password', nullable=True)
    
    # Add index on staff.mobile_number
    op.create_index('ix_staff_mobile_number', 'staff', ['mobile_number'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_staff_mobile_number', table_name='staff')
    op.drop_column('staff', 'profile_completed')
    op.drop_column('staff', 'designation')
    op.alter_column('users', 'hashed_password', nullable=False)
    op.alter_column('users', 'email', nullable=False)

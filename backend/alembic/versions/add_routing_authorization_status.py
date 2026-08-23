"""Add authorization_status columns to routing_rules

Revision ID: add_routing_auth_status
Revises: 
Create Date: 2026-08-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = 'add_routing_auth_status'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add authorization_status enum type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE authorizationstatus AS ENUM ('PENDING', 'AUTHORIZED', 'REJECTED', 'REVOKED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Add new columns to routing_rules
    op.add_column('routing_rules', sa.Column('authorization_status', sa.Enum('PENDING', 'AUTHORIZED', 'REJECTED', 'REVOKED', name='authorizationstatus'), nullable=False, server_default='AUTHORIZED'))
    op.add_column('routing_rules', sa.Column('authorized_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('routing_rules', sa.Column('authorized_by', UUID(as_uuid=True), nullable=True))
    op.add_column('routing_rules', sa.Column('rejection_reason', sa.Text(), nullable=True))
    
    # Set existing rules with staff_id to PENDING, others to AUTHORIZED
    op.execute("""
        UPDATE routing_rules 
        SET authorization_status = 'PENDING' 
        WHERE staff_id IS NOT NULL
    """)
    op.execute("""
        UPDATE routing_rules 
        SET authorization_status = 'AUTHORIZED' 
        WHERE staff_id IS NULL
    """)


def downgrade() -> None:
    op.drop_column('routing_rules', 'rejection_reason')
    op.drop_column('routing_rules', 'authorized_by')
    op.drop_column('routing_rules', 'authorized_at')
    op.drop_column('routing_rules', 'authorization_status')
    op.execute("DROP TYPE IF EXISTS authorizationstatus")

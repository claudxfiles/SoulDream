"""calendar_integration

Revision ID: calendar_integration
Revises: 
Create Date: 2023-09-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'calendar_integration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Agregar columna google_credentials a la tabla users
    op.add_column('users', sa.Column('google_credentials', sa.Text(), nullable=True))
    
    # Crear tabla calendar_events
    op.create_table(
        'calendar_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('is_all_day', sa.Boolean(), default=False),
        sa.Column('color', sa.String(50), nullable=True),
        sa.Column('recurrence_rule', sa.String(255), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), default=False),
        sa.Column('google_event_id', sa.String(255), nullable=True, unique=True),
        sa.Column('sync_status', sa.String(50), default='local'),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('related_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('related_type', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Crear índices
    op.create_index('ix_calendar_events_user_id', 'calendar_events', ['user_id'])
    op.create_index('ix_calendar_events_start_time', 'calendar_events', ['start_time'])
    op.create_index('ix_calendar_events_end_time', 'calendar_events', ['end_time'])
    op.create_index('ix_calendar_events_sync_status', 'calendar_events', ['sync_status'])
    op.create_index('ix_calendar_events_related_id', 'calendar_events', ['related_id'])


def downgrade():
    # Eliminar índices
    op.drop_index('ix_calendar_events_related_id')
    op.drop_index('ix_calendar_events_sync_status')
    op.drop_index('ix_calendar_events_end_time')
    op.drop_index('ix_calendar_events_start_time')
    op.drop_index('ix_calendar_events_user_id')
    
    # Eliminar tablas
    op.drop_table('calendar_events')
    
    # Eliminar columnas
    op.drop_column('users', 'google_credentials') 
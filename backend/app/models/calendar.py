from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from app.db.base_class import Base

class CalendarEvent(Base):
    """Modelo para eventos de calendario."""
    
    __tablename__ = "calendar_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Información básica del evento
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    is_all_day = Column(Boolean, default=False)
    color = Column(String(50), nullable=True)
    
    # Información de recurrencia
    recurrence_rule = Column(String(255), nullable=True)
    is_recurring = Column(Boolean, default=False)
    
    # Información de integración con Google Calendar
    google_event_id = Column(String(255), nullable=True, unique=True)
    sync_status = Column(String(50), default="local")  # local, synced, modified
    last_synced_at = Column(DateTime, nullable=True)
    
    # Relaciones con otras entidades (opcional)
    related_id = Column(UUID(as_uuid=True), nullable=True)
    related_type = Column(String(50), nullable=True)  # task, project, etc.
    
    # Metadatos
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<CalendarEvent {self.title} ({self.start_time})>" 
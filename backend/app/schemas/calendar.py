from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from uuid import UUID

# Esquemas para credenciales de Google
class GoogleCredentials(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: int
    
# Esquemas para eventos de calendario
class CalendarEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_all_day: bool = False
    color: Optional[str] = None
    recurrence_rule: Optional[str] = None
    
class CalendarEventCreate(CalendarEventBase):
    related_id: Optional[UUID] = None
    related_type: Optional[str] = None
    
class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    color: Optional[str] = None
    recurrence_rule: Optional[str] = None
    related_id: Optional[UUID] = None
    related_type: Optional[str] = None
    
class CalendarEventResponse(CalendarEventBase):
    id: UUID
    user_id: UUID
    google_event_id: Optional[str] = None
    sync_status: str = "local"
    is_recurring: bool = False
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        
# Esquemas para sincronización de calendario
class CalendarSyncRequest(BaseModel):
    start_date: datetime
    end_date: datetime
    direction: Literal["pull", "push", "bidirectional"] = "bidirectional"
    sync_type: Literal["manual", "auto"] = "manual"
    background: bool = False
    
class CalendarSyncResponse(BaseModel):
    success: bool
    message: str
    sync_log_id: Optional[str] = None
    events_created: Optional[int] = None
    events_updated: Optional[int] = None 
    events_deleted: Optional[int] = None
    errors: Optional[List[str]] = None 
from pydantic import BaseModel, Field
from typing import Optional, Union, Literal
from datetime import datetime


class NotificationType(str):
    TASK = "task"
    GOAL = "goal"
    HABIT = "habit"
    FINANCE = "finance"
    CALENDAR = "calendar"
    SYSTEM = "system"


class NotificationPriority(str):
    NORMAL = "normal"
    HIGH = "high"


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str  # Tipo de notificación (task, goal, habit, finance, calendar, system)
    priority: str = "normal"  # normal o high
    action_url: Optional[str] = None  # URL o ruta para redirigir al hacer clic
    related_entity_id: Optional[str] = None  # ID del objeto relacionado
    related_entity_type: Optional[str] = None  # Tipo del objeto relacionado


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None


class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    priority: str
    is_read: bool = False
    is_dismissed: bool = False
    action_url: Optional[str] = None
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    created_at: Union[datetime, str]
    updated_at: Optional[Union[datetime, str]] = None

    class Config:
        from_attributes = True
        # orm_mode = True # Eliminado por ser deprecado en Pydantic v2 
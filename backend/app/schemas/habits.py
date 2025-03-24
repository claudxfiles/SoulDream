from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any
from datetime import date, datetime
from enum import Enum


class HabitFrequency(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"


class HabitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: HabitFrequency
    specific_days: Optional[Union[List[int], None]] = None  # Para hábitos semanales: [0, 1, 2, 3, 4, 5, 6] (0 = lunes)
    goal_value: Optional[int] = 1  # Por ejemplo, hacer 10 flexiones
    category: Optional[str] = None
    reminder_time: Optional[str] = None  # Formato "HH:MM"
    cue: Optional[str] = None  # La señal que inicia el hábito
    reward: Optional[str] = None  # La recompensa al completar
    
    class Config:
        # Permitir conversiones de tipo extra
        extra = "allow"
        # Tratar nulos como None
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    specific_days: Optional[List[int]] = None
    goal_value: Optional[int] = None
    category: Optional[str] = None
    reminder_time: Optional[str] = None
    cue: Optional[str] = None
    reward: Optional[str] = None
    current_streak: Optional[int] = None
    best_streak: Optional[int] = None
    total_completions: Optional[int] = None
    related_goal_id: Optional[str] = None


class Habit(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    frequency: HabitFrequency
    specific_days: Optional[List[int]] = None
    goal_value: Optional[int] = 1
    category: Optional[str] = None
    reminder_time: Optional[str] = None
    cue: Optional[str] = None
    reward: Optional[str] = None
    current_streak: int = 0
    best_streak: int = 0
    total_completions: int = 0
    created_at: Union[datetime, str]
    updated_at: Union[datetime, str]
    is_active: bool = True
    related_goal_id: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class HabitLogCreate(BaseModel):
    completed_date: Union[date, str] = None
    notes: Optional[str] = None
    quality_rating: Optional[int] = None
    emotion: Optional[str] = None
    value: Optional[int] = None


class HabitLog(BaseModel):
    id: str
    habit_id: str
    user_id: Optional[str] = None
    completed_date: Union[date, str]
    notes: Optional[str] = None
    quality_rating: Optional[int] = None
    emotion: Optional[str] = None
    created_at: Union[datetime, str]
    value: Optional[int] = None

    class Config:
        from_attributes = True
        populate_by_name = True 
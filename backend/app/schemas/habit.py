from pydantic import BaseModel, Field, UUID4
from typing import List, Optional
from datetime import datetime, date


class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: str = "daily"  # daily, weekly, specific_days
    specific_days: Optional[List[str]] = None
    category: Optional[str] = None
    reminder_time: Optional[str] = None
    cue: Optional[str] = None
    reward: Optional[str] = None


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    specific_days: Optional[List[str]] = None
    category: Optional[str] = None
    reminder_time: Optional[str] = None
    cue: Optional[str] = None
    reward: Optional[str] = None


class HabitInDB(HabitBase):
    id: UUID4
    user_id: UUID4
    current_streak: int = 0
    best_streak: int = 0
    created_at: datetime
    updated_at: datetime


class Habit(HabitInDB):
    pass


class HabitLogCreate(BaseModel):
    habit_id: UUID4
    completed_date: date
    notes: Optional[str] = None
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    emotion: Optional[str] = None


class HabitLogUpdate(BaseModel):
    notes: Optional[str] = None
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    emotion: Optional[str] = None


class HabitLog(BaseModel):
    id: UUID4
    habit_id: UUID4
    completed_date: date
    notes: Optional[str] = None
    quality_rating: Optional[int] = None
    emotion: Optional[str] = None
    created_at: datetime 
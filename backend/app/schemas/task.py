from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.pending
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[datetime] = None
    tags: List[str] = []

class TaskCreate(TaskBase):
    user_id: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    column_order: Optional[int] = None

class TaskInDB(TaskBase):
    id: str
    user_id: str
    column_order: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
    related_goal_id: Optional[str] = None
    category: Optional[str] = None

class Task(TaskInDB):
    pass 
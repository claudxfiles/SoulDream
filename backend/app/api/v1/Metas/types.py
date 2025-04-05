from typing import Optional, List, Literal
from pydantic import BaseModel, UUID4
from datetime import datetime

# Definición de tipos literales para las restricciones
GoalArea = Literal[
    'Desarrollo Personal',
    'Salud y Bienestar',
    'Educación',
    'Finanzas',
    'Hobbies'
]

GoalType = Literal[
    'Otro',
    'Proyecto',
    'Hábito',
    'Aprendizaje',
    'Financiero'
]

GoalPriority = Literal['Baja', 'Media', 'Alta']
GoalStatus = Literal['active', 'completed', 'archived']
GoalProgressType = Literal['numeric', 'percentage', 'boolean']

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    area: GoalArea
    target_date: Optional[datetime] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = 0
    status: GoalStatus = "active"
    progress_type: GoalProgressType
    type: GoalType
    priority: GoalPriority
    image_url: Optional[str] = None
    user_id: UUID4
    start_date: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    area: Optional[GoalArea] = None
    target_date: Optional[datetime] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    status: Optional[GoalStatus] = None
    progress_type: Optional[GoalProgressType] = None
    type: Optional[GoalType] = None
    priority: Optional[GoalPriority] = None
    image_url: Optional[str] = None

class GoalStepBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Literal['pending', 'in_progress', 'completed'] = "pending"
    due_date: Optional[datetime] = None
    ai_generated: bool = False
    goal_id: UUID4
    orderindex: Optional[int] = 0

class GoalStepCreate(GoalStepBase):
    pass

class GoalStepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal['pending', 'in_progress', 'completed']] = None
    due_date: Optional[datetime] = None
    orderindex: Optional[int] = None

class Goal(GoalBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoalStep(GoalStepBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoalWithSteps(Goal):
    steps: List[GoalStep] = [] 
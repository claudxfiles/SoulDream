from pydantic import BaseModel, Field, UUID4
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum


class GoalArea(str, Enum):
    DESARROLLO_PERSONAL = "desarrollo_personal"
    SALUD_BIENESTAR = "salud_bienestar"
    EDUCACION = "educacion"
    FINANZAS = "finanzas"
    HOBBIES = "hobbies"


class GoalType(str, Enum):
    ADQUISICION = "adquisicion"
    APRENDIZAJE = "aprendizaje"
    HABITO = "habito"
    OTRO = "otro"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GoalPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class GoalStepStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class GoalStepBase(BaseModel):
    """Esquema base para pasos de metas"""
    title: str
    description: str
    status: str = "pending"
    dueDate: Optional[str] = None
    aiGenerated: bool = False
    orderIndex: int


class GoalStepCreate(GoalStepBase):
    """Esquema para crear un paso de meta"""
    goalId: str


class GoalStepUpdate(BaseModel):
    """Esquema para actualizar un paso de meta"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    dueDate: Optional[str] = None
    orderIndex: Optional[int] = None


class GoalStepInDB(GoalStepBase):
    id: UUID4
    goal_id: UUID4
    created_at: datetime
    updated_at: datetime
    ai_generated: bool = False


class GoalStep(GoalStepInDB):
    pass


class GoalTimeframe(BaseModel):
    """Esquema para el plazo de una meta"""
    startDate: str
    endDate: str


class GoalBase(BaseModel):
    """Esquema base para metas"""
    title: str
    description: str
    category: str
    timeframe: GoalTimeframe
    progressPercentage: int = 0
    status: str = "active"
    priority: str
    visualizationImageUrl: Optional[str] = None
    type: str
    ai_generated: bool = False


class GoalCreate(GoalBase):
    """Esquema para crear una meta"""
    pass


class GoalUpdate(BaseModel):
    """Esquema para actualizar una meta"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    timeframe: Optional[GoalTimeframe] = None
    progressPercentage: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    visualizationImageUrl: Optional[str] = None
    type: Optional[str] = None


class GoalInDB(GoalBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime
    parent_goal_id: Optional[UUID4] = None
    ai_generated: bool = False


class Goal(GoalInDB):
    steps: Optional[List[GoalStep]] = None


class GoalDetectionRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = None


class GoalDetectionResponse(BaseModel):
    has_goal: bool
    goal: Optional[Dict[str, Any]] = None
    message_response: Optional[str] = None


class GoalPlanRequest(BaseModel):
    goal_id: UUID4


class GoalPlanResponse(BaseModel):
    goal_id: UUID4
    plan: Dict[str, Any]
    steps_created: int = 0


class GoalRead(GoalBase):
    """Esquema para leer una meta"""
    id: str
    userId: str
    createdAt: datetime
    updatedAt: datetime


class GoalStepRead(GoalStepBase):
    """Esquema para leer un paso de meta"""
    id: str
    goalId: str
    createdAt: datetime
    updatedAt: datetime


class GoalWithSteps(GoalRead):
    """Esquema para leer una meta con sus pasos"""
    steps: List[GoalStepRead]


class GoalMetadata(BaseModel):
    """Metadata de una meta detectada por IA"""
    area: str
    goalType: str
    title: str
    description: Optional[str] = None
    steps: Optional[List[str]] = None
    confidence: float
    timeframe: Optional[Dict[str, Any]] = None

    class Config:
        schema_extra = {
            "example": {
                "area": "finanzas",
                "goalType": "adquisicion",
                "confidence": 0.85,
                "title": "Comprar una casa",
                "steps": [
                    "Investigar opciones de financiamiento",
                    "Ahorrar para el anticipo",
                    "Buscar propiedades en áreas de interés"
                ],
                "timeframe": {
                    "startDate": "2023-05-01T00:00:00",
                    "endDate": "2024-05-01T00:00:00",
                    "durationDays": 365
                }
            }
        } 
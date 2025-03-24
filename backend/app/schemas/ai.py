from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
from uuid import UUID

class MessageSender(str, Enum):
    user = "user"
    ai = "ai"

class MessageStatus(str, Enum):
    sending = "sending"
    sent = "sent"
    error = "error"

class MessageBase(BaseModel):
    content: str
    sender: MessageSender
    timestamp: datetime = Field(default_factory=datetime.now)
    status: Optional[MessageStatus] = None

class MessageCreate(MessageBase):
    user_id: str
    conversation_id: str

class MessageInDB(MessageBase):
    id: str
    user_id: str
    conversation_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class Message(MessageInDB):
    pass

class ConversationBase(BaseModel):
    title: Optional[str] = "Nueva conversación"

class ConversationCreate(ConversationBase):
    user_id: str

class ConversationUpdate(BaseModel):
    title: Optional[str] = None

class ConversationInDB(ConversationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_deleted: bool = False

class Conversation(ConversationInDB):
    messages: List[Message] = []

class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    system_message: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    stream: bool = False

class AIChatResponse(BaseModel):
    message: str
    conversation_id: str
    has_goal: bool = False
    goal_metadata: Optional[Dict[str, Any]] = None

class AIPromptRequest(BaseModel):
    prompt: str
    model: str = "qwen/qwq-32b:online"
    temperature: float = 0.7
    max_tokens: int = 800

class AIPromptResponse(BaseModel):
    response: str
    model_used: str
    tokens_used: int
    processing_time: float
    metadata: Optional[Dict[str, Any]] = None

class OpenRouterChatRequest(BaseModel):
    message: str
    messageHistory: Optional[List[Dict[str, str]]] = None
    model: str = "qwen/qwq-32b:online"

class GoalDetectionRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = None

class GoalMetadata(BaseModel):
    title: str
    description: Optional[str] = None
    area: str
    type: str
    target_date: Optional[str] = None
    priority: Optional[str] = None
    steps: Optional[List[str]] = None

class GoalDetectionResponse(BaseModel):
    has_goal: bool
    goal: Optional[Dict[str, Any]] = None

class GoalPlanRequest(BaseModel):
    goal_id: str

class PlanStep(BaseModel):
    title: str
    description: str
    timeframe: str
    resources: List[str]
    success_criteria: str

class PlanObstacle(BaseModel):
    obstacle: str
    solution: str

class Plan(BaseModel):
    title: str
    overview: str
    steps: List[PlanStep]
    obstacles: List[PlanObstacle]
    total_timeframe: str
    success_metrics: List[str]

class GoalPlanResponse(BaseModel):
    plan: Plan

class MessageRole(str, Enum):
    """
    Roles posibles para mensajes en una conversación con IA
    """
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"

class ChatMessage(BaseModel):
    """
    Mensaje individual en una conversación con IA
    """
    role: MessageRole
    content: str

class ChatRequest(BaseModel):
    """
    Solicitud para generar una respuesta de chat
    """
    messages: List[ChatMessage]
    temperature: Optional[float] = Field(default=0.2, ge=0, le=1)
    max_tokens: Optional[int] = Field(default=1000, ge=1, le=4000)
    stream: Optional[bool] = Field(default=False)

class ChatResponse(BaseModel):
    """
    Respuesta de chat
    """
    message: str
    has_goal: bool = False
    goal_metadata: Optional[Dict[str, Any]] = None

class StreamingResponse(BaseModel):
    """
    Respuesta para streaming de chat
    """
    content: str
    is_error: bool = False
    response_type: str = "content"  # content, goal_metadata, error

class GoalDetectionRequest(BaseModel):
    """
    Solicitud para detectar una meta en un mensaje
    """
    message: str

class GoalPlanRequest(BaseModel):
    """
    Solicitud para generar un plan de meta
    """
    goal_metadata: Dict[str, Any] 
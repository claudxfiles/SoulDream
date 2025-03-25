from fastapi import APIRouter
from app.api.endpoints import auth, goals, tasks, finance, habits, calendar, ai, ai_chat

api_router = APIRouter()

# Incluir los routers de endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"]) 
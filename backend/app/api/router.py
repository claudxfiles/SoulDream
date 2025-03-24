from fastapi import APIRouter
from app.api.endpoints import auth, goals, tasks, finance, habits, calendar, ai, ai_chat
from app.api.v1 import api_router as api_v1_router

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

# Incluir la API v1 y sus rutas - usar directamente sin añadir el prefijo v1 ya que main.py ya lo añade
api_router.include_router(api_v1_router, prefix="", tags=["v1"])

# Incluir directamente el router de chat de la v1 (solución temporal)
# api_router.include_router(ai_chat_router, prefix="/v1/ai", tags=["ai-chat"]) 
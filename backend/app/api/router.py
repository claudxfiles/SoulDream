from fastapi import APIRouter
from app.api.v1.ai import ai_router
from app.api.endpoints import auth, goals, tasks, finance, habits, calendar, ai_chat
from app.api.v1.payments import webhook

api_router = APIRouter()

# Incluir los routers de endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(finance.router, prefix="/finance", tags=["finance"])
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(ai_chat.router, prefix="/ai-chat", tags=["ai-chat"])
api_router.include_router(webhook.router, prefix="/payments", tags=["payments"])

@api_router.get("/test")
async def test_endpoint():
    return {"message": "API router funcionando correctamente"} 
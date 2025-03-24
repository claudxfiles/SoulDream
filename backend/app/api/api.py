from fastapi import APIRouter

from app.api.endpoints import items, users, tasks, projects, auth, calendar

api_router = APIRouter()

# Incluir los routers de los endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["calendar"]) 
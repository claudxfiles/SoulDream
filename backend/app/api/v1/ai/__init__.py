from fastapi import APIRouter
from .routes import router as ai_routes_router
from .workout_recommendations import router as workout_recommendations_router

ai_router = APIRouter(prefix="/ai")

# Incluir los routers
ai_router.include_router(ai_routes_router)
ai_router.include_router(workout_recommendations_router)
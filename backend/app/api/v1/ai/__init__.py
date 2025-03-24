from fastapi import APIRouter
from .workout_recommendations import router as workout_recommendations_router

ai_router = APIRouter()

ai_router.include_router(workout_recommendations_router, prefix="") 
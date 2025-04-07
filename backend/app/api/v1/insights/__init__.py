from fastapi import APIRouter
from .routes import router as insights_router

router = APIRouter()
router.include_router(insights_router, prefix="/insights", tags=["insights"]) 
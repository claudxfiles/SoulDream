from fastapi import APIRouter
from .routes import router as metas_router

router = APIRouter()
router.include_router(metas_router, prefix="/metas", tags=["metas"]) 
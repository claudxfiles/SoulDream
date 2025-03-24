from fastapi import APIRouter
from .ai import ai_router

api_router = APIRouter()

# Incluir routers de los diferentes módulos
api_router.include_router(ai_router, prefix="/ai")

# Versión simplificada para pruebas
@api_router.get("/", tags=["test"])
async def root_endpoint():
    """Endpoint raíz para verificar que la API está funcionando"""
    return {"message": "API v1 funcionando correctamente"}

@api_router.get("/test", tags=["test"])
async def test_api_endpoint():
    """Endpoint de prueba para verificar que la API está funcionando"""
    return {"message": "API funcionando correctamente"} 
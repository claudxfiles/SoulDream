from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
import os
import time
from dotenv import load_dotenv
from app.api.router import api_router
from app.core.config import settings
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging_config import setup_logging

# Cargar variables de entorno
load_dotenv()

# Configurar el sistema de logging avanzado
setup_logging()

# Obtener logger para este módulo
logger = logging.getLogger("app.main")

# Middleware para medir el tiempo de respuesta
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Solo loguear peticiones que tarden más de 0.5 segundos
        if process_time > 0.5:
            logger.warning(f"Petición lenta: {request.method} {request.url.path} - {process_time:.2f}s")
        
        return response

# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="API para el proyecto AI Task Manager",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Determinar CORS basado en entorno
if os.environ.get("ENV", "development") == "production":
    # En producción, limitar a orígenes específicos
    origins = [
        "https://souldream.app",  # Ajustar a tu dominio real
        "https://www.souldream.app"
    ]
    logger.info("Ejecutando en modo producción con CORS restringido")
else:
    # En desarrollo, permitir todos los orígenes
    origins = ["*"]
    logger.info("Ejecutando en modo desarrollo con CORS abierto")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los headers
    expose_headers=["Content-Type", "Authorization", "Content-Length"],
)

# Añadir middleware de timing
app.add_middleware(TimingMiddleware)

# Ruta de verificación de estado
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Ruta raíz
@app.get("/")
async def root():
    return {"message": "API AI Task Manager funcionando correctamente"}

# Manejador de excepciones
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Evitar loguear errores de validación HTTP (son normales)
    if hasattr(exc, 'status_code') and 400 <= exc.status_code < 500:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc)},
        )
    
    # Loguear errores del servidor
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Se ha producido un error interno en el servidor"},
    )

# Incluir router principal que contiene todos los endpoints
app.include_router(
    api_router,
    prefix="/api/v1",
)

# Servir archivos estáticos si existe la carpeta
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    import uvicorn
    
    # Obtener puerto del entorno o usar 8000 por defecto
    port = int(os.getenv("PORT", 8000))
    
    # Obtener configuración de workers (para desarrollo, 1 es suficiente)
    workers = int(os.getenv("WORKERS", 1))
    
    # Iniciar el servidor
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True if os.environ.get("ENV", "development") == "development" else False,
        workers=workers
    )

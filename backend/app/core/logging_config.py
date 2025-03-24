import logging
import os
from logging.handlers import RotatingFileHandler
import sys

def setup_logging():
    """
    Configura el sistema de logging con niveles diferentes por módulo
    y rotación de archivos para evitar archivos demasiado grandes
    """
    # Niveles de log por módulo (nivel por defecto: INFO)
    log_levels = {
        "app": os.environ.get("APP_LOG_LEVEL", "INFO"),
        "app.api.endpoints.habits": os.environ.get("HABITS_LOG_LEVEL", "INFO"),
        "app.api.deps": os.environ.get("AUTH_LOG_LEVEL", "WARNING"),
        "app.db.database": os.environ.get("DB_LOG_LEVEL", "WARNING"),
        "uvicorn": os.environ.get("UVICORN_LOG_LEVEL", "WARNING"),
        "httpx": os.environ.get("HTTPX_LOG_LEVEL", "WARNING"),
        "sqlalchemy": os.environ.get("SQL_LOG_LEVEL", "WARNING"),
    }
    
    # Configuración del formato de logs
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configurar el handler para la consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Configurar el handler para archivo con rotación
    log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "app.log")
    file_handler = RotatingFileHandler(
        log_file, 
        maxBytes=10*1024*1024,  # 10MB máximo por archivo
        backupCount=5  # Mantener 5 archivos de backup
    )
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    
    # Configurar el root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Eliminar handlers existentes para evitar duplicados
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Añadir los nuevos handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Configurar los niveles específicos por módulo
    for logger_name, level in log_levels.items():
        module_logger = logging.getLogger(logger_name)
        module_logger.setLevel(getattr(logging, level))
        
        # Si es uvicorn, httpx o sqlalchemy y estamos en producción, 
        # reducir aún más los logs para estas librerías externas
        if logger_name in ["uvicorn", "httpx", "sqlalchemy"] and os.environ.get("ENV") == "production":
            module_logger.setLevel(logging.ERROR)
    
    # Logear la configuración inicial
    logger = logging.getLogger("app")
    logger.info(f"Logging configurado. Entorno: {os.environ.get('ENV', 'development')}")
    
    # Silenciar las advertencias de Pydantic en producción
    if os.environ.get("ENV") == "production":
        logging.getLogger("pydantic").setLevel(logging.ERROR)

# Función para optimizar logs sobre la marcha
def optimize_logging(verbose=False):
    """
    Ajusta los niveles de logging dinámicamente.
    Útil para cambiar temporalmente niveles durante el desarrollo o debugging.
    
    :param verbose: Si es True, aumenta la verbosidad. Si es False, la reduce.
    """
    if verbose:
        # Aumentar verbosidad para debugging
        logging.getLogger("app").setLevel(logging.DEBUG)
        logging.getLogger("app.api.endpoints").setLevel(logging.DEBUG)
        logging.getLogger("httpx").setLevel(logging.INFO)
        logging.getLogger("uvicorn").setLevel(logging.INFO)
    else:
        # Reducir verbosidad para producción
        logging.getLogger("app").setLevel(logging.INFO)
        logging.getLogger("app.api.endpoints").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("uvicorn").setLevel(logging.WARNING) 
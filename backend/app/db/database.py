from supabase import create_client
from app.core.config import settings
import logging
from functools import lru_cache
import time

logger = logging.getLogger(__name__)

# Caché para clientes - guarda los clientes por tipo (normal, admin)
CLIENTS_CACHE = {}
# Tiempo máximo de caché en segundos (10 minutos)
CLIENT_CACHE_TTL = 600

@lru_cache(maxsize=2)
def get_supabase_client():
    """
    Crea y devuelve un cliente de Supabase con caché para evitar crear 
    múltiples conexiones innecesarias
    """
    try:
        # Usar SUPABASE_ANON_KEY si SUPABASE_KEY está vacío
        supabase_key = settings.SUPABASE_KEY
        if not supabase_key:
            supabase_key = settings.SUPABASE_ANON_KEY
            logger.debug("Usando SUPABASE_ANON_KEY como supabase_key")
        
        if not supabase_key:
            raise ValueError("Se requiere una clave de Supabase válida (SUPABASE_KEY o SUPABASE_ANON_KEY)")
            
        return create_client(settings.SUPABASE_URL, supabase_key)
    except Exception as e:
        logger.error(f"Error al conectar con Supabase: {e}")
        raise e

@lru_cache(maxsize=1)
def get_supabase_admin_client():
    """
    Crea y devuelve un cliente de Supabase con permisos de administrador
    """
    try:
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        logger.error(f"Error al conectar con Supabase (admin): {e}")
        raise e

def reset_client_cache():
    """
    Resetea la caché de clientes. Útil después de cambios de configuración.
    """
    get_supabase_client.cache_clear()
    get_supabase_admin_client.cache_clear()
    logger.info("Caché de clientes Supabase reseteada")

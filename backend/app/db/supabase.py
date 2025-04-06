from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """
    Obtiene el cliente de Supabase usando la clave de servicio
    """
    try:
        # Usar la clave de servicio en lugar de la clave anónima
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        )
        logger.info("Cliente Supabase creado exitosamente")
        return client
    except Exception as e:
        logger.error(f"Error al crear cliente Supabase: {str(e)}")
        raise

# Crear una instancia del cliente
supabase_client = get_supabase_client() 
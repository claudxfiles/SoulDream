from typing import Dict, Any, Optional, Callable
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import logging
import os
from datetime import datetime, timedelta
from app.db.database import get_supabase_client
from app.schemas.user import User
from app.core.config import settings

# Alias para mantener compatibilidad
get_supabase = get_supabase_client

# Configuración del logger
logger = logging.getLogger(__name__)

# Configuración del bearer token
security = HTTPBearer(auto_error=False)  # auto_error=False para manejar caso sin token

# Clave secreta para JWT (obtenida de las variables de entorno)
JWT_SECRET = settings.SUPABASE_JWT_SECRET
if not JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET must be set in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Variable para modo de desarrollo (permitir acceso sin autenticación)
DEV_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

# Cache de usuarios para reducir consultas
USER_CACHE = {}
# Tiempo máximo de caché en segundos (5 minutos)
USER_CACHE_TTL = 300

@lru_cache(maxsize=1)
def get_db():
    """
    Crea una sesión de base de datos
    En este caso, al usar Supabase, retornamos el cliente de Supabase
    """
    return get_supabase()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def create_dev_user() -> User:
    """
    Crea un usuario de desarrollo para testing
    """
    return User(
        id="dev-user-id",
        email="dev@example.com",
        full_name="Developer User",
        avatar_url=None,
        email_notifications=True,
        subscription_tier="free",
        created_at=None,
        updated_at=None
    )

def get_user_from_cache(token: str) -> Optional[User]:
    """
    Intenta obtener un usuario del caché
    """
    if token in USER_CACHE:
        user_data, timestamp = USER_CACHE[token]
        # Verificar si el caché ha expirado
        if (datetime.now() - timestamp).total_seconds() < USER_CACHE_TTL:
            return user_data
        else:
            # Eliminar entrada caducada
            del USER_CACHE[token]
    return None

def add_user_to_cache(token: str, user: User) -> None:
    """
    Añade un usuario al caché
    """
    USER_CACHE[token] = (user, datetime.now())
    # Limitar tamaño del caché (máximo 1000 usuarios)
    if len(USER_CACHE) > 1000:
        # Eliminar la entrada más antigua
        oldest_token = min(USER_CACHE, key=lambda k: USER_CACHE[k][1])
        del USER_CACHE[oldest_token]

def verify_token(token: str) -> Optional[User]:
    """
    Verifica un token JWT y devuelve un usuario
    """
    try:
        # Intentar decodificar con nuestra clave
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        
        # Verificar que el token no ha expirado
        if datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
            return None
        
        # Crear un objeto User con los datos del token
        return User(
            id=payload.get("sub"),
            email=payload.get("email", ""),
            full_name=payload.get("name"),
            avatar_url=None,
            email_notifications=True,
            subscription_tier="free",
            created_at=None,
            updated_at=None
        )
    except jwt.PyJWTError:
        return None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = None
) -> Optional[User]:
    """
    Obtiene el usuario actual a partir del token JWT de Supabase
    Acepta el token tanto del header como de los parámetros de la URL
    """
    token = None
    
    # Intentar obtener el token del header
    if credentials:
        token = credentials.credentials
    # Si no hay token en el header, intentar obtenerlo de los parámetros
    elif authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ')[1]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionaron credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Usar el cliente de Supabase para verificar el token
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        
        if not user:
            logger.error("No user found in Supabase response")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Obtener datos del perfil
        profile_response = supabase.table("profiles").select("*").eq("id", user.id).execute()
        
        if not profile_response.data:
            logger.warning(f"No profile found for user {user.id}, creating basic profile")
            profile = {
                "full_name": user.user_metadata.get("full_name", ""),
                "avatar_url": "",
                "email_notifications": True,
                "subscription_tier": "free",
            }
        else:
            profile = profile_response.data[0]
        
        # Crear objeto de usuario
        return User(
            id=user.id,
            email=user.email,
            full_name=profile.get("full_name"),
            avatar_url=profile.get("avatar_url"),
            email_notifications=profile.get("email_notifications", True),
            subscription_tier=profile.get("subscription_tier", "free"),
            created_at=user.created_at,
            updated_at=profile.get("updated_at")
        )
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Verifica que el usuario actual esté activo.
    """
    # Aquí podríamos hacer una verificación adicional si el usuario está activo
    return current_user 
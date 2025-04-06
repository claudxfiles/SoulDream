from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings
from app.schemas.user import User
import logging
import base64

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def decode_base64(key: str) -> str:
    """Decodifica una clave base64 y la retorna como string"""
    # Asegurarse de que la clave esté correctamente rellenada
    padding = 4 - (len(key) % 4)
    if padding != 4:
        key += '=' * padding
    return base64.b64decode(key).decode('utf-8')

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Valida el token JWT de Supabase y retorna la información del usuario
    Acepta el token desde headers o query parameters
    """
    # Intentar obtener el token del header primero
    if not token:
        # Si no hay token en el header, intentar obtenerlo de los query params
        auth_param = request.query_params.get('authorization')
        if auth_param and auth_param.startswith('Bearer '):
            token = auth_param.split(' ')[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Usar la clave JWT de Supabase para decodificar el token
        if not settings.SUPABASE_JWT_SECRET:
            logger.error("SUPABASE_JWT_SECRET no está configurado")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de configuración del servidor"
            )
        
        logger.debug(f"Intentando decodificar token con algoritmo HS256")
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}  # No verificar el audience por ahora
        )
        logger.debug(f"Token decodificado exitosamente")
        return payload
    except JWTError as e:
        logger.error(f"Error al decodificar token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_from_token(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Valida el token JWT de Supabase y retorna el usuario actual
    
    Args:
        request: Request object para obtener query params
        token: Token JWT de autenticación desde header
        
    Returns:
        User: Información del usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o ha expirado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Intentar obtener el token del header primero
    if not token:
        # Si no hay token en el header, intentar obtenerlo de los query params
        auth_param = request.query_params.get('authorization')
        if auth_param and auth_param.startswith('Bearer '):
            token = auth_param.split(' ')[1]

    if not token:
        raise credentials_exception
    
    try:
        if not settings.SUPABASE_JWT_SECRET:
            logger.error("SUPABASE_JWT_SECRET no está configurado")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error de configuración del servidor"
            )
            
        logger.debug(f"Intentando decodificar token con algoritmo HS256")
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}  # No verificar el audience por ahora
        )
        logger.debug(f"Token decodificado exitosamente")
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        return User(
            id=user_id,
            email=payload.get("email", ""),
            is_active=True
        )
    except JWTError as e:
        logger.error(f"Error al decodificar token: {str(e)}")
        raise credentials_exception 
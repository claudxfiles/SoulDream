from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.security import SECRET_KEY, ALGORITHM
from app.schemas.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Valida el token JWT y retorna el usuario actual
    
    Args:
        token: Token JWT de autenticación
        
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
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # TODO: Obtener datos completos del usuario desde la base de datos
        # Por ahora retornamos información básica del token
        return User(
            id=user_id,
            email=payload.get("email", ""),
            is_active=True
        )
    except JWTError:
        raise credentials_exception 
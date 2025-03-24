import jwt
import time
import os
from fastapi import Request, HTTPException, Depends, Header
from typing import Dict, Optional
from app.core.config import settings

# Importamos la función decode_jwt directamente del módulo jwt_bearer
from .jwt_bearer import decode_jwt, JWTBearer

# Usar la configuración de Supabase
JWT_SECRET = settings.SUPABASE_JWT_SECRET or os.getenv("SUPABASE_JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def token_response(token: str):
    return {
        "access_token": token,
        "token_type": "bearer"
    }


def sign_jwt(user_id: str, username: str) -> Dict[str, str]:
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": time.time() + 24 * 60 * 60  # 24 horas
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token_response(token)


async def get_current_user(token: str = Depends(JWTBearer())) -> Dict:
    """
    Extracts the current user information from JWT token
    """
    try:
        payload = decode_jwt(token)
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid token or expired token",
            )
        
        # Imprimir payload para depuración (solo en desarrollo)
        if os.getenv("ENV") == "development":
            print(f"Token payload keys: {list(payload.keys())}")
        
        # Intentar extraer el user_id del payload siguiendo formatos de Supabase
        user_id = None
        
        # 1. Intentar obtener de sub (estándar JWT)
        if "sub" in payload:
            user_id = payload["sub"]
        
        # 2. Intentar obtener de user_id directo
        elif "user_id" in payload:
            user_id = payload["user_id"]
        
        # 3. Intentar obtener del claim personalizado "user"
        elif "user" in payload and isinstance(payload["user"], dict):
            user_id = payload["user"].get("id")
        
        # 4. Para tokens de Supabase, verificar en función del tipo de token
        elif "aud" in payload:
            # Token de servicio de Supabase
            if payload["aud"] == "authenticated" and "sub" in payload:
                user_id = payload["sub"]
        
        if not user_id:
            print(f"Debugging JWT payload: {payload}")
            raise HTTPException(
                status_code=401,
                detail="Could not find user ID in token",
            )
        
        # Extraer también email o username si está disponible
        email = None
        
        # Buscar email en lugares comunes
        if "email" in payload:
            email = payload["email"]
        elif "user" in payload and isinstance(payload["user"], dict):
            email = payload["user"].get("email")
        
        user_data = {
            "user_id": user_id,
            "username": email or payload.get("username", "unknown")
        }
        
        return user_data
    except Exception as e:
        print(f"Error validando token: {e}")
        print(f"Token (primeros 20 caracteres): {token[:20] if token else 'None'}...")
        raise HTTPException(
            status_code=401,
            detail=f"Could not validate credentials: {str(e)}",
        ) 
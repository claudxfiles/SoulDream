from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any

from app.core.config import settings
from app.services.auth import authenticate_user, get_current_user
from app.schemas.user import User, Token, UserCreate
from app.utils.security import create_access_token
from app.db.database import get_supabase_client
from datetime import timedelta
import uuid

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    Obtiene un token de acceso JWT para el usuario
    """
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=User)
async def register_user(user_in: UserCreate) -> Any:
    """
    Registra un nuevo usuario
    """
    supabase = get_supabase_client()
    
    try:
        # Registrar usuario en Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_in.email,
            "password": user_in.password
        })
        
        user = auth_response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear el usuario"
            )
        
        # Crear perfil del usuario
        profile_data = {
            "id": user.id,
            "full_name": user_in.full_name,
            "avatar_url": "",
            "email_notifications": True,
            "subscription_tier": "free",
            "created_at": user.created_at,
            "updated_at": user.created_at
        }
        
        profile_response = supabase.table("profiles").insert(profile_data).execute()
        
        if not profile_response.data:
            # Si falla la creación del perfil, eliminar el usuario
            # Nota: En un entorno de producción, esto debería manejarse con transacciones
            supabase.auth.admin.delete_user(user.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el perfil del usuario"
            )
        
        # Crear objeto de usuario para la respuesta
        user_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user_in.full_name,
            "avatar_url": "",
            "email_notifications": True,
            "subscription_tier": "free",
            "created_at": user.created_at,
            "updated_at": user.created_at
        }
        
        return User(**user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar usuario: {str(e)}"
        )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Obtiene el usuario actual
    """
    return current_user 
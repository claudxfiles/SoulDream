from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class UserBase(BaseModel):
    """Esquema base para usuarios"""
    email: str
    full_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    """Esquema para crear un usuario"""
    password: str

class UserUpdate(BaseModel):
    """Esquema para actualizar un usuario"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email_notifications: Optional[bool] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    """Modelo de usuario en la base de datos"""
    id: str
    created_at: Union[datetime, str]
    updated_at: Optional[Union[datetime, str]] = None
    hashed_password: str

class User(BaseModel):
    """Modelo de usuario para API responses"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    email_notifications: bool = True
    subscription_tier: str = "free"
    created_at: Optional[Union[datetime, str]] = None
    updated_at: Optional[Union[datetime, str]] = None

class UserProfile(BaseModel):
    """Perfil extendido del usuario"""
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    subscription_tier: str = "free"
    email_notifications: bool = True
    created_at: Union[datetime, str]
    updated_at: Optional[Union[datetime, str]] = None
    preferences: Optional[Dict[str, Any]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str  # User ID
    email: Optional[str] = None
    name: Optional[str] = None
    exp: int  # Expiration timestamp

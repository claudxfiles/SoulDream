from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Any, Union, Optional
import jwt
from app.core.config import settings

# Contexto para encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración para JWT
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con su versión hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Genera un hash seguro para una contraseña en texto plano.
    """
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT con la información del usuario.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    jwt_secret = settings.SUPABASE_JWT_SECRET
    
    encoded_jwt = jwt.encode(to_encode, jwt_secret, algorithm=ALGORITHM)
    return encoded_jwt 
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from uuid import uuid4

from app.db.base_class import Base, BaseModel

class User(Base, BaseModel):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    
    # Campos para integración con Supabase
    supabase_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # Campos para suscripción
    subscription_tier = Column(String, default="free")

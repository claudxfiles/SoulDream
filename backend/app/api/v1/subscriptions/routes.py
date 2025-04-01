from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.subscription import SubscriptionResponse
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SubscriptionDetails(BaseModel):
    plan_value: float
    member_since: datetime
    plan_type: str
    plan_interval: str
    plan_currency: str
    plan_status: str
    subscription_date: datetime
    plan_validity_end: datetime
    plan_features: list

@router.get("/current", response_model=SubscriptionDetails)
async def get_current_subscription(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles de la suscripción actual del usuario
    """
    query = """
        SELECT 
            sp.price as plan_value,
            p.created_at as member_since,
            sp.name as plan_type,
            sp.interval as plan_interval,
            sp.currency as plan_currency,
            s.status as plan_status,
            s.created_at as subscription_date,
            s.current_period_ends_at as plan_validity_end,
            sp.features as plan_features
        FROM subscriptions s
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        LEFT JOIN profiles p ON s.user_id = p.id
        WHERE s.user_id = :user_id
        ORDER BY s.created_at DESC
        LIMIT 1
    """
    
    result = db.execute(query, {"user_id": current_user["id"]}).first()
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="No se encontró suscripción activa para el usuario"
        )
    
    return SubscriptionDetails(**result._asdict()) 
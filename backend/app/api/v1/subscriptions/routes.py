from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionDetails,
    SubscriptionPlanResponse
)
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

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

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def list_subscription_plans(
    db: Session = Depends(get_db)
):
    """
    Lista todos los planes de suscripción disponibles
    """
    query = """
        SELECT 
            id,
            name,
            description,
            price,
            currency,
            interval,
            features,
            created_at,
            updated_at
        FROM subscription_plans
        WHERE is_active = true
        ORDER BY price ASC
    """
    
    result = db.execute(query).fetchall()
    return [SubscriptionPlanResponse(**row._asdict()) for row in result]

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
            s.current_period_end as plan_validity_end,
            sp.features as plan_features
        FROM subscriptions s
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        LEFT JOIN profiles p ON s.user_id = p.id
        WHERE s.user_id = :user_id
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
    """
    
    result = db.execute(query, {"user_id": current_user["id"]}).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró suscripción activa para el usuario"
        )
    
    return SubscriptionDetails(**result._asdict())

@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea una nueva suscripción para el usuario
    """
    # Verificar que el plan existe
    plan_query = """
        SELECT id FROM subscription_plans 
        WHERE id = :plan_id AND is_active = true
    """
    plan = db.execute(plan_query, {"plan_id": subscription.plan_id}).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan de suscripción no encontrado o inactivo"
        )
    
    # Verificar si ya existe una suscripción activa
    active_sub_query = """
        SELECT id FROM subscriptions 
        WHERE user_id = :user_id AND status = 'active'
    """
    active_sub = db.execute(
        active_sub_query, 
        {"user_id": current_user["id"]}
    ).first()
    
    if active_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya tiene una suscripción activa"
        )
    
    # Crear nueva suscripción
    insert_query = """
        INSERT INTO subscriptions (
            user_id,
            plan_id,
            status,
            paypal_subscription_id,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            created_at,
            updated_at
        ) VALUES (
            :user_id,
            :plan_id,
            'pending',
            :paypal_subscription_id,
            NOW(),
            NOW() + INTERVAL '1 month',
            :cancel_at_period_end,
            NOW(),
            NOW()
        ) RETURNING *
    """
    
    new_subscription = db.execute(
        insert_query,
        {
            "user_id": current_user["id"],
            "plan_id": subscription.plan_id,
            "paypal_subscription_id": subscription.paypal_subscription_id,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
    ).first()
    
    db.commit()
    
    # Obtener detalles completos de la suscripción
    subscription_query = """
        SELECT 
            s.*,
            sp.name as plan_name,
            sp.description as plan_description,
            sp.price as plan_price,
            sp.currency as plan_currency,
            sp.interval as plan_interval,
            sp.features as plan_features
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.id = :subscription_id
    """
    
    result = db.execute(
        subscription_query, 
        {"subscription_id": new_subscription.id}
    ).first()
    
    return SubscriptionResponse(**result._asdict())

@router.delete("/{subscription_id}", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: UUID,
    update_data: SubscriptionUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancela una suscripción existente
    """
    # Verificar que la suscripción existe y pertenece al usuario
    query = """
        SELECT id FROM subscriptions 
        WHERE id = :subscription_id 
        AND user_id = :user_id 
        AND status = 'active'
    """
    
    subscription = db.execute(
        query, 
        {
            "subscription_id": subscription_id,
            "user_id": current_user["id"]
        }
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada o no activa"
        )
    
    # Actualizar suscripción
    update_query = """
        UPDATE subscriptions 
        SET 
            status = 'cancelled',
            cancelled_at = NOW(),
            cancel_at_period_end = :cancel_at_period_end,
            cancellation_reason = :cancellation_reason,
            updated_at = NOW()
        WHERE id = :subscription_id
        RETURNING *
    """
    
    updated_subscription = db.execute(
        update_query,
        {
            "subscription_id": subscription_id,
            "cancel_at_period_end": update_data.cancel_at_period_end,
            "cancellation_reason": update_data.cancellation_reason
        }
    ).first()
    
    db.commit()
    
    # Obtener detalles completos de la suscripción
    subscription_query = """
        SELECT 
            s.*,
            sp.name as plan_name,
            sp.description as plan_description,
            sp.price as plan_price,
            sp.currency as plan_currency,
            sp.interval as plan_interval,
            sp.features as plan_features
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.id = :subscription_id
    """
    
    result = db.execute(
        subscription_query, 
        {"subscription_id": subscription_id}
    ).first()
    
    return SubscriptionResponse(**result._asdict()) 
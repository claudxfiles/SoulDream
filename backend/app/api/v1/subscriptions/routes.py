from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionPlanResponse
)
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from app.api.v1.payments.paypal_client import paypal_client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {request.headers}")
    
    response = await call_next(request)
    
    logger.info(f"Response status: {response.status_code}")
    return response

class SubscriptionDetails(BaseModel):
    id: str = Field(..., description="UUID de la suscripción")
    paypal_subscription_id: Optional[str] = Field(None, description="ID de la suscripción en PayPal")
    plan_value: float = Field(..., description="Valor del plan")
    member_since: datetime = Field(..., description="Fecha de inicio de membresía")
    plan_type: str = Field(..., description="Tipo de plan")
    plan_interval: str = Field(..., description="Intervalo de facturación")
    plan_currency: str = Field(..., description="Moneda del plan")
    plan_status: str = Field(..., description="Estado del plan")
    subscription_date: datetime = Field(..., description="Fecha de suscripción")
    plan_validity_end: datetime = Field(..., description="Fecha de fin de validez")
    plan_features: list = Field(default_list=[], description="Características del plan")
    status: str = Field(..., description="Estado de la suscripción")

    class Config:
        json_encoders = {
            UUID: str
        }

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
    logger.info(f"Getting subscription for user: {current_user['id']}")
    
    query = """
        SELECT 
            s.id::text as id,
            s.paypal_subscription_id as paypal_subscription_id,  # AQUÍ ESTÁ EL ERROR
            sp.price as plan_value,
            s.created_at as member_since,
            sp.name as plan_type,
            sp.interval as plan_interval,
            sp.currency as plan_currency,
            s.status as plan_status,
            s.created_at as subscription_date,
            s.current_period_ends_at as plan_validity_end,
            sp.features as plan_features,
            s.status as status
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.user_id = :user_id
        AND s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 1
    """
    
    logger.info("Executing subscription query")
    result = db.execute(query, {"user_id": current_user["id"]}).first()
    
    if not result:
        logger.warning(f"No active subscription found for user: {current_user['id']}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró suscripción activa para el usuario"
        )
    
    # Convert result to dict and ensure all fields are present
    subscription_data = dict(result._mapping)
    logger.info("Raw subscription data from database: %s", subscription_data)
    
    # Ensure all required fields are present and properly typed
    try:
        # Convert UUID to string explicitly
        if isinstance(subscription_data.get('id'), UUID):
            subscription_data['id'] = str(subscription_data['id'])
        
        # Ensure plan_features is a list
        if subscription_data.get('plan_features') is None:
            subscription_data['plan_features'] = []
        elif isinstance(subscription_data['plan_features'], str):
            subscription_data['plan_features'] = subscription_data['plan_features'].split(',')
        
        logger.info("Processed subscription data: %s", subscription_data)
        
        subscription = SubscriptionDetails(**subscription_data)
        logger.info("Successfully created SubscriptionDetails object: %s", subscription.dict())
        return subscription
    except Exception as e:
        logger.error("Error creating SubscriptionDetails: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing subscription data: {str(e)}"
        )

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
            paypal_subscription_id,  # Usa este campo para el ID de PayPal
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            created_at,
            updated_at
        ) VALUES (
            :user_id,
            :plan_id,
            'pending',
            :paypal_subscription_id,  # Usa este parámetro
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
        SELECT id, paypal_subscription_id FROM subscriptions  # Usa paypal_subscription_id en lugar de subscription_id
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
    
    try:
        # Y cuando cancelas en PayPal:
        await paypal_client.cancel_subscription(
            subscription.paypal_subscription_id,  # Usa este campo
            update_data.cancellation_reason or "User requested cancellation"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar la suscripción en PayPal: {str(e)}"
        )
    
    # Actualizar suscripción en nuestra base de datos
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
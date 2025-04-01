from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.subscription import SubscriptionResponse

router = APIRouter()

@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles completos de la suscripción actual del usuario,
    incluyendo información del plan.
    """
    try:
        # Consulta para obtener la suscripción actual con detalles del plan
        query = """
            SELECT 
                s.*,
                sp.name as plan_name,
                sp.description as plan_description,
                sp.price as plan_price,
                sp.currency as plan_currency,
                sp.interval as plan_interval,
                sp.features as plan_features
            FROM subscriptions s
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = :user_id 
            AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
        """
        
        result = db.execute(
            query,
            {"user_id": current_user["id"]}
        ).fetchone()

        if not result:
            raise HTTPException(
                status_code=404,
                detail="No se encontró una suscripción activa"
            )

        # Convertir el resultado a un diccionario
        subscription_data = dict(result)
        
        return subscription_data

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener la suscripción: {str(e)}"
        ) 
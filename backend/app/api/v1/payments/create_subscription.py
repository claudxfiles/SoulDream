from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ...deps import get_supabase, get_current_user
from .paypal_client import paypal_client
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

@router.post("/create-subscription")
async def create_subscription(
    plan_id: str,
    supabase: Client = Depends(get_supabase),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        # Crear suscripción en PayPal
        subscription = await paypal_client.create_subscription(
            plan_id=plan_id,
            user_email=current_user["email"],
            user_name=current_user["email"].split("@")[0]
        )

        if "id" not in subscription:
            raise HTTPException(status_code=400, detail="Error al crear la suscripción en PayPal")

        # Guardar suscripción provisional en Supabase
        subscription_data = {
            "user_id": current_user["id"],
            "paypal_subscription_id": subscription["id"],
            "status": "APPROVAL_PENDING",
            "current_period_start": datetime.utcnow().isoformat(),
        }

        result = await supabase.table("subscriptions").insert(subscription_data).execute()
        
        if "error" in result:
            raise HTTPException(status_code=500, detail="Error al guardar la suscripción")

        # Obtener el enlace de aprobación
        approval_link = next(
            (link for link in subscription["links"] if link["rel"] == "approve"),
            None
        )

        if not approval_link:
            raise HTTPException(status_code=500, detail="No se encontró el enlace de aprobación")

        return {
            "subscriptionId": subscription["id"],
            "approvalUrl": approval_link["href"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
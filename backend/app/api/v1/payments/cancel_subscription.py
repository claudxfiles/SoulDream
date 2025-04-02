from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ...deps import get_supabase, get_current_user
from .paypal_client import paypal_client
from datetime import datetime
from typing import Dict, Any, Optional

router = APIRouter()

@router.post("/cancel-subscription")
async def cancel_subscription(
    subscription_id: str,
    reason: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, str]:
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        # Verificar que la suscripción pertenece al usuario
        result = await supabase.table("subscriptions").select(
            "id, paypal_subscription_id"
        ).eq("user_id", current_user["id"]).eq(
            "paypal_subscription_id", subscription_id
        ).single().execute()

        if "error" in result or not result.data:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")

        # Cancelar la suscripción en PayPal
        await paypal_client.cancel_subscription(
            subscription_id,
            reason or "Cancelled by user"
        )

        # Actualizar el estado en la base de datos
        await supabase.table("subscriptions").update({
            "status": "cancelled",
            "cancel_at_period_end": True,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", result.data["id"]).execute()

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
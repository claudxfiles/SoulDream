from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from ...deps import get_supabase, get_current_user
from .paypal_client import paypal_client
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

@router.post("/cancel-subscription")
async def cancel_subscription(
    subscription_id: str,
    user_id: str,
    reason: str = "Cancelled by user",
    supabase: Client = Depends(get_supabase),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Cancela una suscripción de PayPal y actualiza el estado en la base de datos
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        if current_user["id"] != user_id:
            raise HTTPException(status_code=403, detail="No autorizado para cancelar esta suscripción")

        # Verificar que la suscripción pertenece al usuario
        result = await supabase.table("subscriptions").select(
            "id, paypal_subscription_id"
        ).eq("user_id", user_id).eq(
            "paypal_subscription_id", subscription_id
        ).single().execute()

        if "error" in result or not result.data:
            raise HTTPException(status_code=404, detail="Suscripción no encontrada")

        # Cancelar la suscripción en PayPal
        try:
            await paypal_client.cancel_subscription(subscription_id, reason)
        except Exception as e:
            print(f"Error al cancelar suscripción en PayPal: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error al cancelar la suscripción en PayPal"
            )

        now = datetime.utcnow().isoformat()

        # Actualizar el estado en la base de datos
        update_result = await supabase.table("subscriptions").update({
            "status": "cancelled",
            "cancelled_at": now,
            "cancel_at_period_end": True,
            "cancellation_reason": reason,
            "updated_at": now
        }).eq("id", result.data["id"]).execute()

        if "error" in update_result:
            print(f"Error al actualizar suscripción: {update_result['error']}")
            raise HTTPException(
                status_code=500,
                detail="Error al actualizar el estado de la suscripción"
            )

        # Registrar el evento
        event_result = await supabase.table("subscription_events").insert({
            "subscription_id": result.data["id"],
            "event_type": "subscription_cancelled",
            "metadata": {
                "cancelled_at": now,
                "reason": reason,
                "paypal_subscription_id": subscription_id
            }
        }).execute()

        if "error" in event_result:
            print(f"Error al registrar evento: {event_result['error']}")

        # Actualizar el nivel de suscripción del usuario
        profile_result = await supabase.table("profiles").update({
            "subscription_tier": "free",
            "updated_at": now
        }).eq("id", user_id).execute()

        if "error" in profile_result:
            print(f"Error al actualizar perfil: {profile_result['error']}")

        return {
            "success": True,
            "message": "Suscripción cancelada exitosamente"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la cancelación: {str(e)}"
        ) 
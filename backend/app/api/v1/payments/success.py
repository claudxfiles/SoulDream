from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import Client
from ...deps import get_supabase, get_current_user
from .paypal_client import paypal_client
from datetime import datetime
from typing import Dict, Any
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/subscription-success")
async def subscription_success(
    request: Request,
    supabase: Client = Depends(get_supabase),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> RedirectResponse:
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        # Obtener parámetros de la URL
        params = dict(request.query_params)
        subscription_id = params.get("subscription_id")
        token = params.get("token")

        if not subscription_id or not token:
            raise HTTPException(status_code=400, detail="Parámetros faltantes")

        # Obtener detalles de la suscripción de PayPal
        subscription_details = await paypal_client.get_subscription_details(subscription_id)

        # Obtener el plan de la base de datos
        plan_result = await supabase.table("subscription_plans").select(
            "id"
        ).eq("paypal_plan_id", subscription_details["plan_id"]).single().execute()

        if "error" in plan_result or not plan_result.data:
            raise HTTPException(status_code=404, detail="Plan no encontrado")

        # Buscar suscripción existente
        existing_sub = await supabase.table("subscriptions").select(
            "id"
        ).eq("user_id", current_user["id"]).single().execute()

        subscription_data = {
            "subscription_plan_id": plan_result.data["id"],
            "paypal_subscription_id": subscription_id,
            "status": "active",
            "current_period_start": datetime.utcnow().isoformat(),
            "current_period_end": subscription_details["billing_info"]["next_billing_time"],
            "cancel_at_period_end": False,
            "updated_at": datetime.utcnow().isoformat()
        }

        if "data" in existing_sub and existing_sub.data:
            # Actualizar suscripción existente
            await supabase.table("subscriptions").update(
                subscription_data
            ).eq("id", existing_sub.data["id"]).execute()
        else:
            # Crear nueva suscripción
            subscription_data["user_id"] = current_user["id"]
            await supabase.table("subscriptions").insert(subscription_data).execute()

        # Registrar el pago inicial
        payment_data = {
            "user_id": current_user["id"],
            "subscription_plan_id": plan_result.data["id"],
            "paypal_order_id": token,
            "amount": subscription_details["billing_info"]["last_payment"]["amount"]["value"],
            "currency": subscription_details["billing_info"]["last_payment"]["amount"]["currency_code"],
            "status": "completed",
            "created_at": datetime.utcnow().isoformat()
        }
        
        await supabase.table("payments").insert(payment_data).execute()

        # Redirigir al usuario
        frontend_url = f"{request.base_url.scheme}://{request.base_url.netloc}"
        return RedirectResponse(
            url=f"{frontend_url}/dashboard/profile/subscription?success=true",
            status_code=302
        )

    except Exception as e:
        # En caso de error, redirigir con mensaje de error
        frontend_url = f"{request.base_url.scheme}://{request.base_url.netloc}"
        return RedirectResponse(
            url=f"{frontend_url}/dashboard/profile/subscription?error=true",
            status_code=302
        ) 
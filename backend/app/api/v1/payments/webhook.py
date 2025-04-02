from fastapi import APIRouter, Request, HTTPException, Depends
from supabase import create_client, Client
from typing import Dict, Any
import os
from datetime import datetime
from ...deps import get_supabase
import json
import base64
import requests
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature
from app.core.config import settings
from app.services.payments import PayPalService
from app.db.database import get_supabase_client
import hmac
import hashlib
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

async def verify_paypal_signature(transmission_id: str, timestamp: str, webhook_id: str, 
                                event_body: str, cert_url: str, auth_algo: str, 
                                actual_sig: str) -> bool:
    try:
        # Obtener el certificado de PayPal
        response = requests.get(cert_url)
        cert_data = response.content

        # Crear el mensaje de verificación
        webhook_event = {
            "auth_algo": auth_algo,
            "cert_url": cert_url,
            "transmission_id": transmission_id,
            "transmission_sig": actual_sig,
            "transmission_time": timestamp,
            "webhook_id": webhook_id,
            "webhook_event": json.loads(event_body)
        }

        # Verificar con PayPal
        verify_url = "https://api-m.paypal.com/v1/notifications/verify-webhook-signature"
        if os.getenv("PAYPAL_MODE") == "sandbox":
            verify_url = "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature"

        auth = (os.getenv("PAYPAL_CLIENT_ID"), os.getenv("PAYPAL_CLIENT_SECRET"))
        headers = {"Content-Type": "application/json"}
        
        response = requests.post(
            verify_url,
            auth=auth,
            headers=headers,
            json=webhook_event
        )

        if response.status_code == 200:
            verification_status = response.json().get("verification_status")
            return verification_status == "SUCCESS"
        
        return False

    except Exception as e:
        print(f"Error verifying PayPal signature: {str(e)}")
        return False

async def verify_paypal_webhook(
    request: Request,
    webhook_id: str = settings.PAYPAL_WEBHOOK_ID,
    webhook_secret: str = settings.PAYPAL_WEBHOOK_SECRET
) -> bool:
    """Verifica la autenticidad del webhook de PayPal"""
    try:
        # Obtener headers necesarios
        auth_algo = request.headers.get("PAYPAL-AUTH-ALGO")
        cert_url = request.headers.get("PAYPAL-CERT-URL")
        transmission_id = request.headers.get("PAYPAL-TRANSMISSION-ID")
        transmission_sig = request.headers.get("PAYPAL-TRANSMISSION-SIG")
        transmission_time = request.headers.get("PAYPAL-TRANSMISSION-TIME")

        # Obtener el body como string
        body = await request.body()
        body_str = body.decode()

        # Construir el string de verificación
        validation_str = f"{transmission_id}|{transmission_time}|{webhook_id}|{body_str}"
        
        # Calcular la firma usando HMAC SHA256
        hmac_obj = hmac.new(
            webhook_secret.encode(),
            validation_str.encode(),
            hashlib.sha256
        )
        signature = base64.b64encode(hmac_obj.digest()).decode()

        # Comparar firmas
        return hmac.compare_digest(signature, transmission_sig)
    except Exception as e:
        logger.error(f"Error verificando webhook: {str(e)}")
        return False

@router.post("/webhook")
async def handle_paypal_webhook(request: Request):
    """
    Maneja los eventos del webhook de PayPal
    """
    try:
        # Verificar autenticidad del webhook
        if not await verify_paypal_webhook(request):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Obtener el payload
        payload = await request.json()
        event_type = payload.get("event_type")
        resource = payload.get("resource", {})

        # Obtener cliente de Supabase
        supabase = get_supabase_client()

        # Manejar diferentes tipos de eventos
        event_handlers = {
            "BILLING.SUBSCRIPTION.ACTIVATED": handle_subscription_activated,
            "BILLING.SUBSCRIPTION.CANCELLED": handle_subscription_cancelled,
            "BILLING.SUBSCRIPTION.CREATED": handle_subscription_created,
            "BILLING.SUBSCRIPTION.EXPIRED": handle_subscription_expired,
            "BILLING.SUBSCRIPTION.REACTIVATED": handle_subscription_reactivated,
            "BILLING.SUBSCRIPTION.UPDATED": handle_subscription_updated,
            "PAYMENT.SALE.COMPLETED": handle_payment_completed,
            "PAYMENT.SALE.DENIED": handle_payment_denied,
            "PAYMENT.SALE.PENDING": handle_payment_pending
        }

        if event_type in event_handlers:
            await event_handlers[event_type](resource, supabase)
            logger.info(f"Evento procesado exitosamente: {event_type}")
        else:
            logger.warning(f"Evento no manejado: {event_type}")

        return {"status": "success", "event": event_type}

    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_subscription_activated(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción activada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("value", 0),
                "currency": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("currency_code", "USD"),
                "status": "subscription_activated",
                "payment_id": f"activate_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando activación de suscripción: {str(e)}")
        raise

async def handle_subscription_expired(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción expirada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "expired",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": 0,
                "currency": "USD",
                "status": "subscription_expired",
                "payment_id": f"expire_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando expiración de suscripción: {str(e)}")
        raise

async def handle_subscription_reactivated(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción reactivada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("value", 0),
                "currency": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("currency_code", "USD"),
                "status": "subscription_reactivated",
                "payment_id": f"reactivate_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando reactivación de suscripción: {str(e)}")
        raise

async def handle_subscription_updated(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción actualizada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        subscription_data = {
            "updated_at": datetime.utcnow().isoformat()
            # Aquí puedes agregar más campos que necesites actualizar
        }
        
        await supabase.table("subscriptions").update(subscription_data).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("value", 0),
                "currency": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("currency_code", "USD"),
                "status": "subscription_updated",
                "payment_id": f"update_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando actualización de suscripción: {str(e)}")
        raise

async def handle_payment_denied(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago denegado"""
    try:
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")
        subscription_id = resource.get("billing_agreement_id")
        
        # Registrar en la tabla payments
        payment_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": "failed",
            "transaction_id": transaction_id,
            "subscription_id": subscription_id,
            "date": datetime.utcnow().isoformat()
        }
        
        await supabase.table("payments").insert(payment_data).execute()
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "status": "payment_denied",
            "payment_id": transaction_id,
            "payment_method": "paypal"
        }
        
        await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando pago denegado: {str(e)}")
        raise

async def handle_payment_pending(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago pendiente"""
    try:
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")
        subscription_id = resource.get("billing_agreement_id")
        
        # Registrar en la tabla payments
        payment_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": "pending",
            "transaction_id": transaction_id,
            "subscription_id": subscription_id,
            "date": datetime.utcnow().isoformat()
        }
        
        await supabase.table("payments").insert(payment_data).execute()
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "status": "payment_pending",
            "payment_id": transaction_id,
            "payment_method": "paypal"
        }
        
        await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando pago pendiente: {str(e)}")
        raise

async def handle_payment_completed(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago completado"""
    try:
        # Extraer datos del recurso
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")  # Asumiendo que enviamos el user_id en custom_id
        subscription_id = resource.get("billing_agreement_id")
        
        # Registrar en la tabla payments
        payment_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "transaction_id": transaction_id,
            "subscription_id": subscription_id,
            "date": datetime.utcnow().isoformat()
        }
        
        result = await supabase.table("payments").insert(payment_data).execute()
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "payment_id": transaction_id,
            "payment_method": "paypal"
        }
        
        await supabase.table("payment_history").insert(history_data).execute()
            
    except Exception as e:
        logger.error(f"Error procesando pago completado: {str(e)}")
        raise

async def handle_subscription_created(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción creada"""
    try:
        subscription_id = resource.get("id")
        user_id = resource.get("subscriber", {}).get("payer_id")  # O donde PayPal envíe el user_id
        
        # Actualizar el estado de la suscripción
        subscription_data = {
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await supabase.table("subscriptions").update(subscription_data).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("value", 0),
            "currency": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("currency_code", "USD"),
            "status": "subscription_created",
            "payment_id": subscription_id,
            "payment_method": "paypal"
        }
        
        await supabase.table("payment_history").insert(history_data).execute()
        
    except Exception as e:
        logger.error(f"Error procesando suscripción creada: {str(e)}")
        raise

async def handle_subscription_cancelled(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción cancelada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "cancelled",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": 0,
                "currency": "USD",
                "status": "subscription_cancelled",
                "payment_id": f"cancel_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
        
    except Exception as e:
        logger.error(f"Error procesando suscripción cancelada: {str(e)}")
        raise

async def handle_subscription_suspended(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción suspendida"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "suspended",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("id", subscription_id).single().execute()
        
        if subscription and subscription.data:
            history_data = {
                "user_id": subscription.data["user_id"],
                "subscription_id": subscription_id,
                "amount": 0,
                "currency": "USD",
                "status": "subscription_suspended",
                "payment_id": f"suspend_{subscription_id}",
                "payment_method": "paypal"
            }
            
            await supabase.table("payment_history").insert(history_data).execute()
        
    except Exception as e:
        logger.error(f"Error procesando suscripción suspendida: {str(e)}")
        raise 
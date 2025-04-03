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
from fastapi.responses import JSONResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Configurar el logger específicamente para el webhook
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)
logger.setLevel(logging.INFO)

@router.get("/webhook/test")
async def test_webhook():
    """
    Endpoint de prueba para verificar que la ruta del webhook está accesible
    """
    logger.info("PayPal Webhook Test - Endpoint accedido")
    return {
        "status": "success",
        "message": "Webhook endpoint is accessible",
        "timestamp": datetime.utcnow().isoformat(),
        "route": "/api/payments/webhook"
    }

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

async def verify_paypal_webhook(request: Request) -> bool:
    """Verifica la autenticidad del webhook de PayPal usando su API oficial"""
    try:
        # Log de la URL completa
        url = str(request.url)
        logger.info(f"PayPal Webhook - Solicitud recibida en: {url}")
        
        # Obtener headers necesarios
        headers = dict(request.headers)
        logger.info(f"PayPal Webhook - Headers recibidos: {json.dumps(headers, indent=2)}")

        # Obtener el body como string
        body = await request.body()
        body_str = body.decode()
        
        # Log del body recibido
        logger.info(f"PayPal Webhook - Body recibido: {body_str[:200]}...")

        # Construir el objeto de verificación
        webhook_event = {
            "auth_algo": request.headers.get("PAYPAL-AUTH-ALGO"),
            "cert_url": request.headers.get("PAYPAL-CERT-URL"),
            "transmission_id": request.headers.get("PAYPAL-TRANSMISSION-ID"),
            "transmission_sig": request.headers.get("PAYPAL-TRANSMISSION-SIG"),
            "transmission_time": request.headers.get("PAYPAL-TRANSMISSION-TIME"),
            "webhook_id": settings.PAYPAL_WEBHOOK_ID,
            "webhook_event": json.loads(body_str)
        }

        # Obtener el token de acceso
        auth = (settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET)
        token_response = requests.post(
            f"{settings.PAYPAL_API_URL}/v1/oauth2/token",
            auth=auth,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data="grant_type=client_credentials"
        )
        
        if token_response.status_code != 200:
            logger.error(f"Error obteniendo token de acceso: {token_response.text}")
            return False
            
        access_token = token_response.json()["access_token"]

        # Verificar con la API de PayPal
        verify_response = requests.post(
            f"{settings.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            json=webhook_event
        )

        if verify_response.status_code == 200:
            verification_status = verify_response.json().get("verification_status")
            is_valid = verification_status == "SUCCESS"
            
            if is_valid:
                logger.info("PayPal Webhook - Firma verificada correctamente")
            else:
                logger.error(f"PayPal Webhook - Verificación falló: {verification_status}")
            
            return is_valid
        
        logger.error(f"PayPal Webhook - Error en verificación: {verify_response.text}")
        return False

    except Exception as e:
        logger.error(f"PayPal Webhook - Error verificando webhook: {str(e)}")
        logger.exception("PayPal Webhook - Stacktrace completo:")
        return False

@router.post("/webhook")
async def handle_paypal_webhook(request: Request):
    """
    Maneja los eventos del webhook de PayPal
    """
    try:
        # Verificar autenticidad del webhook
        logger.info("PayPal Webhook - Verificando firma...")
        if not await verify_paypal_webhook(request):
            logger.error("PayPal Webhook - Firma inválida")
            return JSONResponse(
                status_code=401,
                content={
                    "status": "error",
                    "message": "Invalid webhook signature",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        logger.info("PayPal Webhook - Firma verificada correctamente")

        # Obtener el payload
        try:
            payload = await request.json()
        except json.JSONDecodeError as e:
            logger.error(f"PayPal Webhook - Error decodificando JSON: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Invalid JSON payload",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

        logger.info(f"PayPal Webhook - Payload recibido: {json.dumps(payload, indent=2)}")
        
        event_type = payload.get("event_type")
        logger.info(f"PayPal Webhook - Procesando evento tipo: {event_type}")

        # Aquí procesas los diferentes tipos de eventos
        if event_type == "PAYMENT.SALE.COMPLETED":
            logger.info("Procesando pago completado")
            # Procesar pago completado
            pass
        elif event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            logger.info("Procesando suscripción activada")
            # Procesar suscripción activada
            pass
        # ... otros tipos de eventos

        return JSONResponse(
            content={
                "status": "success",
                "message": "Webhook processed successfully",
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"PayPal Webhook - Error procesando webhook: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

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
            "created_at": datetime.utcnow().isoformat()
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
            "payment_method": "paypal",
            "created_at": datetime.utcnow().isoformat()
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
            "created_at": datetime.utcnow().isoformat()
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
            "payment_method": "paypal",
            "created_at": datetime.utcnow().isoformat()
        }
        
        await supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        logger.error(f"Error procesando pago pendiente: {str(e)}")
        raise

async def handle_payment_completed(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago completado"""
    try:
        logger.info("PayPal Payment - Iniciando procesamiento de pago completado")
        logger.info(f"PayPal Payment - Datos del recurso: {json.dumps(resource, indent=2)}")

        # Extraer datos del recurso
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")  # Asumiendo que enviamos el user_id en custom_id
        subscription_id = resource.get("billing_agreement_id")
        
        logger.info(f"PayPal Payment - Datos extraídos: transaction_id={transaction_id}, amount={amount}, currency={currency}, user_id={user_id}, subscription_id={subscription_id}")

        # Registrar en la tabla payments
        payment_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "transaction_id": transaction_id,
            "subscription_id": subscription_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"PayPal Payment - Intentando guardar en tabla payments: {json.dumps(payment_data, indent=2)}")
        result = await supabase.table("payments").insert(payment_data).execute()
        logger.info(f"PayPal Payment - Guardado en payments exitoso: {json.dumps(result, indent=2)}")
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "payment_id": transaction_id,
            "payment_method": "paypal",
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"PayPal Payment - Intentando guardar en payment_history: {json.dumps(history_data, indent=2)}")
        result = await supabase.table("payment_history").insert(history_data).execute()
        logger.info(f"PayPal Payment - Guardado en payment_history exitoso: {json.dumps(result, indent=2)}")
        
        logger.info("PayPal Payment - Procesamiento de pago completado exitosamente")
            
    except Exception as e:
        logger.error(f"PayPal Payment - Error procesando pago completado: {str(e)}")
        logger.exception("PayPal Payment - Stacktrace completo:")
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
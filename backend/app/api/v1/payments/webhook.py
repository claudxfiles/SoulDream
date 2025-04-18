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
import traceback
from fastapi.responses import JSONResponse
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# Configurar el logger específicamente para el webhook
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(console_handler)
logger.setLevel(logging.INFO)

@router.get("/api/payments/webhook/test")
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
        print(f"[PayPal Debug] URL recibida: {url}")
        
        # Obtener headers necesarios
        headers = dict(request.headers)
        print(f"[PayPal Debug] Headers completos recibidos: {json.dumps(headers, indent=2)}")

        # Obtener el body como string
        body = await request.body()
        body_str = body.decode()
        
        # Log del body recibido
        print(f"[PayPal Debug] Body recibido: {body_str}")

        # Extraer headers específicos de PayPal
        webhook_id = settings.PAYPAL_WEBHOOK_ID
        print(f"[PayPal Debug] Webhook ID configurado: {webhook_id}")

        # Construir el objeto de verificación
        webhook_event = {
            "auth_algo": request.headers.get("paypal-auth-algo"),
            "cert_url": request.headers.get("paypal-cert-url"),
            "transmission_id": request.headers.get("paypal-transmission-id"),
            "transmission_sig": request.headers.get("paypal-transmission-sig"),
            "transmission_time": request.headers.get("paypal-transmission-time"),
            "webhook_id": webhook_id,
            "webhook_event": json.loads(body_str)
        }

        print(f"[PayPal Debug] Objeto de verificación: {json.dumps(webhook_event, indent=2)}")

        # Obtener el token de acceso
        auth = (settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET)
        print(f"[PayPal Debug] Obteniendo token con Client ID: {settings.PAYPAL_CLIENT_ID[:10]}...")
        
        token_response = requests.post(
            f"{settings.PAYPAL_API_URL}/v1/oauth2/token",
            auth=auth,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data="grant_type=client_credentials"
        )
        
        print(f"[PayPal Debug] Respuesta de token: Status={token_response.status_code}")
        print(f"[PayPal Debug] Respuesta de token completa: {token_response.text}")
        
        if token_response.status_code != 200:
            print(f"[PayPal Debug] Error obteniendo token: {token_response.text}")
            return False
            
        access_token = token_response.json()["access_token"]
        print("[PayPal Debug] Token de acceso obtenido correctamente")

        # Verificar con la API de PayPal
        verify_url = f"{settings.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature"
        print(f"[PayPal Debug] URL de verificación: {verify_url}")
        
        verify_response = requests.post(
            verify_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}"
            },
            json=webhook_event
        )

        print(f"[PayPal Debug] Respuesta de verificación: Status={verify_response.status_code}")
        print(f"[PayPal Debug] Respuesta de verificación completa: {verify_response.text}")

        if verify_response.status_code == 200:
            verification_status = verify_response.json().get("verification_status")
            is_valid = verification_status == "SUCCESS"
            
            print(f"[PayPal Debug] Estado de verificación: {verification_status}")
            if is_valid:
                print("[PayPal Debug] Verificación exitosa")
            else:
                print("[PayPal Debug] Verificación fallida")
            
            return is_valid
        
        print(f"[PayPal Debug] Error en verificación: {verify_response.text}")
        return False

    except Exception as e:
        print(f"[PayPal Debug] Error en verificación: {str(e)}")
        print("[PayPal Debug] Stacktrace completo:")
        print(traceback.format_exc())
        return False

@router.post("/api/payments/webhook")
async def handle_paypal_webhook(request: Request):
    try:
        print("[PayPal Debug] ====== INICIO DE PROCESAMIENTO DE WEBHOOK ======")
        print("[PayPal Debug] Verificando configuración de Supabase...")
        
        # Verificar configuración de Supabase
        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_KEY", "")[:10] + "..." if os.getenv("SUPABASE_KEY") else ""
        
        print(f"[PayPal Debug] URL de Supabase: {supabase_url}")
        print(f"[PayPal Debug] Key de Supabase (primeros caracteres): {supabase_key}")
        
        # Obtener el payload y validar su estructura
        try:
            payload = await request.json()
            print(f"[PayPal Debug] Payload recibido: {json.dumps(payload, indent=2)}")
            
            # Validar campos requeridos
            if not isinstance(payload, dict):
                raise ValueError("Payload must be a JSON object")
                
            event_type = payload.get("event_type")
            if not event_type:
                raise ValueError("Missing event_type in payload")
                
            resource = payload.get("resource")
            if not isinstance(resource, dict):
                raise ValueError("Missing or invalid resource object in payload")
                
            # Extraer subscription_id con validación
            subscription_id = resource.get("id")
            if not subscription_id:
                # Intentar encontrar subscription_id en otros lugares del payload
                subscription_id = (
                    resource.get("subscription_id") or 
                    resource.get("billing_agreement_id") or 
                    f"temp_{datetime.utcnow().timestamp()}"  # ID temporal si no se encuentra
                )
            
            print(f"[PayPal Debug] Subscription ID extraído: {subscription_id}")
            
            # Preparar datos para inserción
            event_record = {
                "id": str(uuid.uuid4()),  # Generar UUID explícitamente
                "event_type": event_type,
                "subscription_id": subscription_id,
                "plan_id": resource.get("plan_id"),
                "status": resource.get("status") or "unknown",
                "processed_at": datetime.utcnow().isoformat(),
                "raw_data": json.dumps(payload),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            print(f"[PayPal Debug] Datos a insertar en paypal_events: {json.dumps(event_record, indent=2)}")
            
            # Obtener cliente de Supabase
            supabase = get_supabase_client()
            print("[PayPal Debug] Cliente Supabase obtenido correctamente")
            
            # Insertar en paypal_events
            try:
                print("[PayPal Debug] Intentando insertar en paypal_events...")
                insert_result = supabase.table("paypal_events").insert(event_record).execute()
                print(f"[PayPal Debug] Resultado de inserción en paypal_events: {json.dumps(insert_result.data if insert_result else 'No data', indent=2)}")
                
                # Verificar que se insertó correctamente
                verify_result = supabase.table("paypal_events").select("*").eq("id", event_record["id"]).execute()
                print(f"[PayPal Debug] Verificación de inserción: {json.dumps(verify_result.data if verify_result else 'No data', indent=2)}")
                
                # Verificar si se creó el registro en paypal_events_log
                log_result = supabase.table("paypal_events_log").select("*").eq("event_id", event_record["id"]).execute()
                print(f"[PayPal Debug] Verificación de log: {json.dumps(log_result.data if log_result else 'No data', indent=2)}")
                
            except Exception as insert_error:
                print(f"[PayPal Debug] Error insertando en paypal_events: {str(insert_error)}")
                print("[PayPal Debug] Stacktrace completo:")
                print(traceback.format_exc())
                # Intentar inserción directa en la base de datos
                try:
                    print("[PayPal Debug] Intentando inserción directa via SQL...")
                    sql_result = supabase.raw("""
                        INSERT INTO paypal_events (
                            id, event_type, subscription_id, plan_id, status, 
                            processed_at, raw_data, created_at, updated_at
                        ) VALUES (
                            :id, :event_type, :subscription_id, :plan_id, :status,
                            :processed_at, :raw_data::jsonb, :created_at, :updated_at
                        ) RETURNING *
                    """, {
                        "id": event_record["id"],
                        "event_type": event_record["event_type"],
                        "subscription_id": event_record["subscription_id"],
                        "plan_id": event_record["plan_id"],
                        "status": event_record["status"],
                        "processed_at": event_record["processed_at"],
                        "raw_data": event_record["raw_data"],
                        "created_at": event_record["created_at"],
                        "updated_at": event_record["updated_at"]
                    }).execute()
                    print(f"[PayPal Debug] Resultado de inserción SQL: {json.dumps(sql_result.data if sql_result else 'No data', indent=2)}")
                except Exception as sql_error:
                    print(f"[PayPal Debug] Error en inserción SQL: {str(sql_error)}")
                    print(traceback.format_exc())
                    raise
            
            # Procesar el evento según su tipo
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
                try:
                    await event_handlers[event_type](resource, supabase)
                    print(f"[PayPal Debug] Evento {event_type} procesado exitosamente")
                except Exception as handler_error:
                    print(f"[PayPal Debug] Error en el manejador del evento {event_type}: {str(handler_error)}")
                    print(traceback.format_exc())
            
            print("[PayPal Debug] ====== FIN DE PROCESAMIENTO DE WEBHOOK ======")
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "message": "Webhook processed",
                    "event_type": event_type,
                    "subscription_id": subscription_id,
                    "event_id": event_record["id"]
                }
            )
            
        except json.JSONDecodeError as json_error:
            print(f"[PayPal Debug] Error decodificando JSON: {str(json_error)}")
            print(f"[PayPal Debug] Body recibido: {await request.body()}")
            return JSONResponse(
                status_code=200,
                content={
                    "status": "error",
                    "message": "Invalid JSON payload",
                    "error": str(json_error)
                }
            )
            
    except Exception as e:
        print(f"[PayPal Debug] Error general en webhook: {str(e)}")
        print(traceback.format_exc())
        return JSONResponse(
            status_code=200,
            content={
                "status": "error",
                "message": str(e)
            }
        )

async def handle_subscription_activated(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción activada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        subscription_update = supabase.table("subscriptions").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("paypal_subscription_id", subscription_id).execute()
        
        # Verificar si se actualizó alguna fila
        if not subscription_update.data:
            print(f"[PayPal Debug] No se encontró la suscripción con ID {subscription_id} para activar")
            # Crear registro de evento para revisión
            await register_pending_event(supabase, "SUBSCRIPTION_ACTIVATED", subscription_id, resource)
            return
        
        # Registrar en payment_history
        subscription_result = supabase.table("subscriptions").select("user_id").eq("paypal_subscription_id", subscription_id).single().execute()
        
        if subscription_result and subscription_result.data:
            history_data = {
                "user_id": subscription_result.data["user_id"],
                "subscription_id": subscription_id,
                "amount": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("value", 0),
                "currency": resource.get("billing_info", {}).get("last_payment", {}).get("amount", {}).get("currency_code", "USD"),
                "status": "subscription_activated",
                "payment_id": f"activate_{subscription_id}",
                "payment_method": "paypal"
            }
            
            history_result = supabase.table("payment_history").insert(history_data).execute()
    except Exception as e:
        print(f"[PayPal Debug] Error procesando activación de suscripción: {str(e)}")
        raise

async def handle_subscription_expired(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción expirada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        subscription_update = await supabase.table("subscriptions").update({
            "status": "expired",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("paypal_subscription_id", subscription_id).execute()
        
        # Verificar si se actualizó alguna fila
        if not subscription_update.data:
            print(f"[PayPal Debug] No se encontró la suscripción con ID {subscription_id} para marcar como expirada")
            # Crear registro de evento para revisión
            await register_pending_event(supabase, "SUBSCRIPTION_EXPIRED", subscription_id, resource)
            return
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("paypal_subscription_id", subscription_id).single().execute()
        
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
        print(f"[PayPal Debug] Error procesando expiración de suscripción: {str(e)}")
        raise

async def handle_subscription_reactivated(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción reactivada"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        subscription_update = await supabase.table("subscriptions").update({
            "status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("paypal_subscription_id", subscription_id).execute()
        
        # Verificar si se actualizó alguna fila
        if not subscription_update.data:
            print(f"[PayPal Debug] No se encontró la suscripción con ID {subscription_id} para reactivar")
            # Crear registro de evento para revisión
            await register_pending_event(supabase, "SUBSCRIPTION_REACTIVATED", subscription_id, resource)
            return
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("paypal_subscription_id", subscription_id).single().execute()
        
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
        print(f"[PayPal Debug] Error procesando reactivación de suscripción: {str(e)}")
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
        
        subscription_update = await supabase.table("subscriptions").update(subscription_data).eq("paypal_subscription_id", subscription_id).execute()
        
        # Verificar si se actualizó alguna fila
        if not subscription_update.data:
            print(f"[PayPal Debug] No se encontró la suscripción con ID {subscription_id} para actualizar")
            # Crear registro de evento para revisión
            await register_pending_event(supabase, "SUBSCRIPTION_UPDATED", subscription_id, resource)
            return
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("paypal_subscription_id", subscription_id).single().execute()
        
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
        print(f"[PayPal Debug] Error procesando actualización de suscripción: {str(e)}")
        raise

async def handle_payment_denied(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago denegado"""
    try:
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")
        subscription_id = resource.get("billing_agreement_id")
        
        # Verificar que tenemos los datos necesarios
        if not transaction_id or not user_id:
            print(f"[PayPal Debug] Faltan datos para procesar pago denegado: transaction_id={transaction_id}, user_id={user_id}")
            await register_pending_event(supabase, "PAYMENT_DENIED", transaction_id, resource)
            return
        
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
        print(f"[PayPal Debug] Error procesando pago denegado: {str(e)}")
        raise

async def handle_payment_pending(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago pendiente"""
    try:
        transaction_id = resource.get("id")
        amount = float(resource.get("amount", {}).get("total", 0))
        currency = resource.get("amount", {}).get("currency", "USD")
        user_id = resource.get("custom_id")
        subscription_id = resource.get("billing_agreement_id")
        
        # Verificar que tenemos los datos necesarios
        if not transaction_id or not user_id:
            print(f"[PayPal Debug] Faltan datos para procesar pago pendiente: transaction_id={transaction_id}, user_id={user_id}")
            await register_pending_event(supabase, "PAYMENT_PENDING", transaction_id, resource)
            return
        
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
        print(f"[PayPal Debug] Error procesando pago pendiente: {str(e)}")
        raise

async def handle_payment_completed(resource: Dict[str, Any], supabase):
    """Maneja el evento de pago completado"""
    try:
        print("[PayPal Debug] ====== INICIO DE PROCESAMIENTO DE PAGO COMPLETADO ======")
        print(f"[PayPal Debug] Recurso completo recibido: {json.dumps(resource, indent=2)}")

        # Extraer datos del recurso con más detalle
        transaction_id = resource.get("id")
        print(f"[PayPal Debug] Transaction ID: {transaction_id}")

        # Extraer amount y currency con validación
        amount_info = resource.get("amount", {})
        amount = float(amount_info.get("total", 0))
        currency = amount_info.get("currency", "USD")
        print(f"[PayPal Debug] Amount: {amount}, Currency: {currency}")

        # Intentar obtener user_id de diferentes lugares posibles
        user_id = None
        custom_field = resource.get("custom", "")
        if custom_field:
            try:
                custom_data = json.loads(custom_field)
                user_id = custom_data.get("user_id")
            except:
                user_id = custom_field
        
        if not user_id:
            # Intentar obtener de custom_id si existe
            user_id = resource.get("custom_id")
            
        print(f"[PayPal Debug] User ID encontrado: {user_id}")

        # Intentar obtener subscription_id
        subscription_id = resource.get("billing_agreement_id")
        if not subscription_id:
            # Intentar obtener de otros campos posibles
            subscription_id = resource.get("subscription_id") or resource.get("agreement_id")
        
        print(f"[PayPal Debug] Subscription ID encontrado: {subscription_id}")

        if not user_id:
            print("[PayPal Debug] ADVERTENCIA: No se pudo encontrar el user_id en el recurso")
            await register_pending_event(supabase, "PAYMENT_COMPLETED", transaction_id, resource)
            return

        # Registrar en la tabla payments
        payment_data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "transaction_id": transaction_id,
            "subscription_id": subscription_id,
            "created_at": datetime.utcnow().isoformat(),
            "raw_data": json.dumps(resource)  # Guardar el recurso completo para referencia
        }
        
        print(f"[PayPal Debug] Intentando guardar en payments: {json.dumps(payment_data, indent=2)}")
        try:
            result = await supabase.table("payments").insert(payment_data).execute()
            print(f"[PayPal Debug] Respuesta de insert en payments: {json.dumps(result, indent=2)}")
        except Exception as e:
            print(f"[PayPal Debug] Error guardando en payments: {str(e)}")
            print(traceback.format_exc())
        
        # Registrar en payment_history
        history_data = {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "amount": amount,
            "currency": currency,
            "status": "payment_completed",
            "payment_id": transaction_id,
            "payment_method": "paypal",
            "created_at": datetime.utcnow().isoformat(),
            "raw_data": json.dumps(resource)  # Guardar el recurso completo para referencia
        }
        
        print(f"[PayPal Debug] Intentando guardar en payment_history: {json.dumps(history_data, indent=2)}")
        try:
            result = await supabase.table("payment_history").insert(history_data).execute()
            print(f"[PayPal Debug] Respuesta de insert en payment_history: {json.dumps(result, indent=2)}")
        except Exception as e:
            print(f"[PayPal Debug] Error guardando en payment_history: {str(e)}")
            print(traceback.format_exc())
        
        print("[PayPal Debug] ====== FIN DE PROCESAMIENTO DE PAGO COMPLETADO ======")
            
    except Exception as e:
        print(f"[PayPal Debug] Error general en handle_payment_completed: {str(e)}")
        print("[PayPal Debug] Stacktrace completo:")
        print(traceback.format_exc())
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
        
        await supabase.table("subscriptions").update(subscription_data).eq("paypal_subscription_id", subscription_id).execute()
        
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
        print(f"[PayPal Debug] Error procesando suscripción creada: {str(e)}")
        raise

async def handle_subscription_cancelled(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción cancelada"""
    try:
        print("[PayPal Debug] Iniciando handle_subscription_cancelled")
        
        # Obtener detalles del evento
        subscription_id = resource.get("id")
        now = datetime.utcnow().isoformat()
        plan_id = resource.get("plan_id")
        status = resource.get("status")
        
        if not subscription_id:
            print("[PayPal Debug] Error: No se proporcionó ID de suscripción en el webhook")
            return
            
        print(f"[PayPal Debug] Detalles del webhook: ID={subscription_id}, Plan={plan_id}, Status={status}")
        
        # Buscar la suscripción en la base de datos con más detalle
        print("[PayPal Debug] Buscando suscripción en la base de datos...")
        try:
            subscription_result = supabase.table("subscriptions").select("*").eq("paypal_subscription_id", subscription_id).execute()
            print(f"[PayPal Debug] Query ejecutado correctamente")
            print(f"[PayPal Debug] Resultado de búsqueda: {json.dumps(subscription_result.data if subscription_result else 'No data', indent=2)}")
            
            if not subscription_result.data:
                # Intentar una búsqueda case-insensitive
                print("[PayPal Debug] Intentando búsqueda case-insensitive...")
                subscription_result = supabase.table("subscriptions").select("*").ilike("paypal_subscription_id", subscription_id).execute()
                print(f"[PayPal Debug] Resultado de búsqueda case-insensitive: {json.dumps(subscription_result.data if subscription_result else 'No data', indent=2)}")
        except Exception as search_error:
            print(f"[PayPal Debug] Error en la búsqueda de suscripción: {str(search_error)}")
            print(traceback.format_exc())
            raise
        
        if subscription_result.data:
            subscription_data = subscription_result.data[0]
            print(f"[PayPal Debug] Datos de suscripción encontrados: {json.dumps(subscription_data, indent=2)}")
            
            # Actualizar estado en subscriptions
            print("[PayPal Debug] Actualizando estado de la suscripción...")
            update_data = {
                "status": "cancelled",
                "updated_at": now,
                "cancel_at_period_end": True
            }
            
            update_result = supabase.table("subscriptions").update(update_data).eq("paypal_subscription_id", subscription_id).execute()
            print(f"[PayPal Debug] Resultado de la actualización: {json.dumps(update_result.data if update_result else 'No data', indent=2)}")
            
            # Registrar en payment_history
            print("[PayPal Debug] Registrando en payment_history...")
            history_data = {
                "user_id": subscription_data.get("user_id"),
                "subscription_id": subscription_id,
                "amount": 0,
                "currency": "USD",
                "status": "subscription_cancelled",
                "payment_id": f"cancel_{subscription_id}",
                "payment_method": "paypal",
                "created_at": now,
                "payment_details": json.dumps({
                    "event": "subscription_cancelled",
                    "cancelled_at": now,
                    "paypal_subscription_id": subscription_id
                })
            }
            
            history_result = supabase.table("payment_history").insert(history_data).execute()
            print(f"[PayPal Debug] Resultado del registro en historial: {json.dumps(history_result.data if history_result else 'No data', indent=2)}")
            
            print(f"[PayPal Debug] Suscripción {subscription_id} cancelada exitosamente")
        else:
            print(f"[PayPal Debug] No se encontró la suscripción con ID: {subscription_id}")
            # Registrar el evento para procesamiento posterior
            event_data = {
                "event_type": "SUBSCRIPTION_CANCELLED_UNMATCHED",
                "subscription_id": subscription_id,  # Aseguramos que subscription_id esté presente
                "plan_id": plan_id,
                "status": "cancelled",  # Establecemos un estado explícito
                "processed_at": now,
                "raw_data": json.dumps(resource)
            }
            supabase.table("paypal_events").insert(event_data).execute()
            print(f"[PayPal Debug] Evento registrado para procesamiento posterior: {subscription_id}")
            
    except Exception as e:
        print(f"[PayPal Debug] Error procesando cancelación de suscripción: {str(e)}")
        print("[PayPal Debug] Stacktrace completo:")
        print(traceback.format_exc())
        raise

async def handle_subscription_suspended(resource: Dict[str, Any], supabase):
    """Maneja el evento de suscripción suspendida"""
    try:
        subscription_id = resource.get("id")
        
        # Actualizar estado en subscriptions
        await supabase.table("subscriptions").update({
            "status": "suspended",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("paypal_subscription_id", subscription_id).execute()
        
        # Registrar en payment_history
        subscription = await supabase.table("subscriptions").select("user_id").eq("paypal_subscription_id", subscription_id).single().execute()
        
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
        print(f"[PayPal Debug] Error procesando suscripción suspendida: {str(e)}")
        raise 
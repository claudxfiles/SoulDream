import os
from fastapi import FastAPI, Request, HTTPException
import base64
import json
import requests
from typing import Dict
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

PAYPAL_CLIENT_ID = "AcA-7lyAMhjSYYfW9KFSKIQTGqSHYXx-0KPt5UwAHB1Q_XLWRkvS33mM6caUqkDLn10lixwu4e1fT77m"
PAYPAL_CLIENT_SECRET = "EHvW0SB1dMLboUOMzY3Rsqp9aooFySyPaM2r1jMRNPiBDQyeV-vd872BXWh8u5ko8FWjnvyZBFfTFymG"
PAYPAL_WEBHOOK_ID = "69965191J95513931"
SANDBOX = True  # Cambiar a False en producción

BASE_URL = "https://api-m.sandbox.paypal.com" if SANDBOX else "https://api-m.paypal.com"

async def get_access_token() -> str:
    try:
        auth = base64.b64encode(f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()).decode()
        logger.info("Obteniendo access token de PayPal...")
        
        response = requests.post(
            f"{BASE_URL}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data="grant_type=client_credentials"
        )
        
        logger.info(f"Respuesta de token: Status={response.status_code}")
        if response.status_code != 200:
            logger.error(f"Error en respuesta de token: {response.text}")
            raise HTTPException(status_code=500, detail="Error getting PayPal access token")
            
        return response.json()["access_token"]
    except Exception as e:
        logger.error(f"Error en get_access_token: {str(e)}")
        raise

async def verify_webhook_signature(headers: Dict, body: str) -> bool:
    try:
        logger.info("Iniciando verificación de webhook...")
        logger.info(f"Headers recibidos: {json.dumps(headers, indent=2)}")
        
        access_token = await get_access_token()
        logger.info("Access token obtenido exitosamente")
        
        verification_data = {
            "auth_algo": headers.get("paypal-auth-algo"),
            "cert_url": headers.get("paypal-cert-url"),
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "webhook_id": PAYPAL_WEBHOOK_ID,
            "webhook_event": json.loads(body)
        }
        
        logger.info(f"Datos de verificación: {json.dumps(verification_data, indent=2)}")

        response = requests.post(
            f"{BASE_URL}/v1/notifications/verify-webhook-signature",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json=verification_data
        )
        
        logger.info(f"Respuesta de verificación: Status={response.status_code}")
        logger.info(f"Respuesta completa: {response.text}")

        if response.status_code == 200:
            verification_status = response.json().get("verification_status")
            logger.info(f"Estado de verificación: {verification_status}")
            return verification_status == "SUCCESS"
            
        logger.error(f"Error en verificación: {response.text}")
        return False
    except Exception as e:
        logger.error(f"Error verificando webhook: {str(e)}")
        return False

@app.post("/api/payments/webhook")
async def handle_webhook(request: Request):
    try:
        logger.info("Recibida notificación de webhook de PayPal")
        
        # Obtener los headers y el body
        headers = dict(request.headers)
        body = await request.body()
        body_str = body.decode()
        
        logger.info(f"Body recibido: {body_str}")

        # Verificar la firma del webhook
        is_valid = await verify_webhook_signature(headers, body_str)
        if not is_valid:
            logger.error("Verificación de webhook falló")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Procesar el evento
        event_data = json.loads(body_str)
        event_type = event_data.get("event_type")
        logger.info(f"Procesando evento tipo: {event_type}")

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

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
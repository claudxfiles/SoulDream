from typing import Dict, Any, Optional
import json
import hmac
import hashlib
import base64
import requests
from fastapi import HTTPException
from app.core.config import settings

class PayPalService:
    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.mode = settings.PAYPAL_MODE
        self.webhook_id = settings.PAYPAL_WEBHOOK_ID
        self.base_url = "https://api-m.sandbox.paypal.com" if self.mode == "sandbox" else "https://api-m.paypal.com"
        self._access_token = None

    async def get_access_token(self) -> str:
        """Obtiene el token de acceso de PayPal"""
        if not self._access_token:
            url = f"{self.base_url}/v1/oauth2/token"
            headers = {
                "Accept": "application/json",
                "Accept-Language": "en_US"
            }
            data = {"grant_type": "client_credentials"}
            response = requests.post(
                url,
                auth=(self.client_id, self.client_secret),
                headers=headers,
                data=data
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Error al obtener el token de PayPal"
                )
            self._access_token = response.json()["access_token"]
        return self._access_token

    def verify_webhook_signature(self, headers: Dict[str, str], body: str) -> bool:
        """
        Verifica la firma del webhook de PayPal
        """
        webhook_event = json.loads(body)
        
        verification_data = {
            "auth_algo": headers.get("PAYPAL-AUTH-ALGO"),
            "cert_url": headers.get("PAYPAL-CERT-URL"),
            "transmission_id": headers.get("PAYPAL-TRANSMISSION-ID"),
            "transmission_sig": headers.get("PAYPAL-TRANSMISSION-SIG"),
            "transmission_time": headers.get("PAYPAL-TRANSMISSION-TIME"),
            "webhook_id": self.webhook_id,
            "webhook_event": webhook_event
        }

        url = f"{self.base_url}/v1/notifications/verify-webhook-signature"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._access_token}"
        }
        
        response = requests.post(url, headers=headers, json=verification_data)
        
        if response.status_code == 200:
            verification_status = response.json().get("verification_status")
            return verification_status == "SUCCESS"
        return False

    async def process_webhook_event(self, event_type: str, resource: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesa los eventos del webhook de PayPal
        """
        handlers = {
            "BILLING.SUBSCRIPTION.ACTIVATED": self._handle_subscription_activated,
            "BILLING.SUBSCRIPTION.CANCELLED": self._handle_subscription_cancelled,
            "BILLING.SUBSCRIPTION.CREATED": self._handle_subscription_created,
            "BILLING.SUBSCRIPTION.EXPIRED": self._handle_subscription_expired,
            "BILLING.SUBSCRIPTION.UPDATED": self._handle_subscription_updated,
            "PAYMENT.SALE.COMPLETED": self._handle_payment_completed,
            "PAYMENT.SALE.DENIED": self._handle_payment_denied,
            "PAYMENT.SALE.PENDING": self._handle_payment_pending
        }
        
        handler = handlers.get(event_type)
        if handler:
            return await handler(resource)
        return {"status": "ignored", "message": f"Evento no manejado: {event_type}"}

    async def _handle_subscription_activated(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para suscripción activada
        return {"status": "success", "message": "Suscripción activada"}

    async def _handle_subscription_cancelled(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para suscripción cancelada
        return {"status": "success", "message": "Suscripción cancelada"}

    async def _handle_subscription_created(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para suscripción creada
        return {"status": "success", "message": "Suscripción creada"}

    async def _handle_subscription_expired(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para suscripción expirada
        return {"status": "success", "message": "Suscripción expirada"}

    async def _handle_subscription_updated(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para suscripción actualizada
        return {"status": "success", "message": "Suscripción actualizada"}

    async def _handle_payment_completed(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para pago completado
        return {"status": "success", "message": "Pago completado"}

    async def _handle_payment_denied(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para pago denegado
        return {"status": "success", "message": "Pago denegado"}

    async def _handle_payment_pending(self, resource: Dict[str, Any]) -> Dict[str, Any]:
        # Implementar lógica para pago pendiente
        return {"status": "success", "message": "Pago pendiente"} 
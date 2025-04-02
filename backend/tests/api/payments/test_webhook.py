import pytest
from fastapi.testclient import TestClient
from app.main import app
import hmac
import hashlib
import base64
import json
from datetime import datetime

client = TestClient(app)

def create_mock_webhook_headers(payload: str, webhook_id: str, webhook_secret: str):
    """Crea headers de prueba para el webhook"""
    timestamp = datetime.utcnow().isoformat()
    transmission_id = "test-transmission-id"
    
    # Crear firma
    validation_str = f"{transmission_id}|{timestamp}|{webhook_id}|{payload}"
    hmac_obj = hmac.new(
        webhook_secret.encode(),
        validation_str.encode(),
        hashlib.sha256
    )
    signature = base64.b64encode(hmac_obj.digest()).decode()
    
    return {
        "PAYPAL-AUTH-ALGO": "SHA256withRSA",
        "PAYPAL-CERT-URL": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-5edf5786",
        "PAYPAL-TRANSMISSION-ID": transmission_id,
        "PAYPAL-TRANSMISSION-SIG": signature,
        "PAYPAL-TRANSMISSION-TIME": timestamp
    }

@pytest.mark.asyncio
async def test_payment_completed_webhook():
    """Test del webhook para pago completado"""
    payload = {
        "event_type": "PAYMENT.SALE.COMPLETED",
        "resource": {
            "id": "test-payment-id",
            "amount": {
                "total": "99.99",
                "currency": "USD"
            },
            "billing_agreement_id": "test-subscription-id"
        }
    }
    
    headers = create_mock_webhook_headers(
        json.dumps(payload),
        "test-webhook-id",
        "test-webhook-secret"
    )
    
    response = client.post(
        "/api/v1/payments/webhook",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_subscription_created_webhook():
    """Test del webhook para suscripción creada"""
    payload = {
        "event_type": "BILLING.SUBSCRIPTION.CREATED",
        "resource": {
            "id": "test-subscription-id",
            "plan_id": "test-plan-id",
            "status": "ACTIVE"
        }
    }
    
    headers = create_mock_webhook_headers(
        json.dumps(payload),
        "test-webhook-id",
        "test-webhook-secret"
    )
    
    response = client.post(
        "/api/v1/payments/webhook",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"

@pytest.mark.asyncio
async def test_invalid_signature():
    """Test de firma inválida"""
    payload = {
        "event_type": "TEST.EVENT",
        "resource": {}
    }
    
    headers = {
        "PAYPAL-AUTH-ALGO": "SHA256withRSA",
        "PAYPAL-CERT-URL": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-5edf5786",
        "PAYPAL-TRANSMISSION-ID": "invalid-id",
        "PAYPAL-TRANSMISSION-SIG": "invalid-signature",
        "PAYPAL-TRANSMISSION-TIME": datetime.utcnow().isoformat()
    }
    
    response = client.post(
        "/api/v1/payments/webhook",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 401 
import os
import requests
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def create_paypal_webhook():
    # Configuración
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
    mode = os.getenv('PAYPAL_MODE', 'sandbox')
    webhook_url = "https://api.presentandflow.cl/api/payments/webhook"

    # URL base según el modo
    base_url = "https://api-m.sandbox.paypal.com" if mode == "sandbox" else "https://api-m.paypal.com"

    # Obtener token de acceso
    auth_url = f"{base_url}/v1/oauth2/token"
    auth_response = requests.post(
        auth_url,
        auth=(client_id, client_secret),
        data={'grant_type': 'client_credentials'}
    )
    
    if auth_response.status_code != 200:
        print("Error obteniendo token:", auth_response.json())
        return
    
    access_token = auth_response.json()['access_token']

    # Crear webhook
    webhook_data = {
        "url": webhook_url,
        "event_types": [
            {"name": "PAYMENT.SALE.COMPLETED"},
            {"name": "BILLING.SUBSCRIPTION.CREATED"},
            {"name": "BILLING.SUBSCRIPTION.ACTIVATED"},
            {"name": "BILLING.SUBSCRIPTION.UPDATED"},
            {"name": "BILLING.SUBSCRIPTION.CANCELLED"},
            {"name": "BILLING.SUBSCRIPTION.SUSPENDED"},
            {"name": "BILLING.SUBSCRIPTION.EXPIRED"}
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    create_response = requests.post(
        f"{base_url}/v1/notifications/webhooks",
        json=webhook_data,
        headers=headers
    )

    if create_response.status_code == 201:
        webhook_info = create_response.json()
        print("\nWebhook creado exitosamente!")
        print(f"Webhook ID: {webhook_info['id']}")
        
        # Obtener el webhook signing secret
        verify_url = f"{base_url}/v1/notifications/webhooks/{webhook_info['id']}/verify-signature"
        verify_response = requests.post(
            verify_url,
            headers=headers,
            json={
                "transmission_id": "test",
                "transmission_time": "2024-01-01T00:00:00Z",
                "cert_url": "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-35c2474e",
                "auth_algo": "SHA256withRSA",
                "transmission_sig": "test",
                "webhook_id": webhook_info['id'],
                "webhook_event": {"test": "test"}
            }
        )

        if verify_response.status_code == 200:
            webhook_secret = verify_response.json().get('verification_status')
            print(f"\nWebhook Secret: {webhook_secret}")
            print("\nAgrega estas variables a tu .env y a Railway:")
            print(f"PAYPAL_WEBHOOK_ID={webhook_info['id']}")
            print(f"PAYPAL_WEBHOOK_SECRET={webhook_secret}")
        else:
            print("Error obteniendo webhook secret:", verify_response.json())
    else:
        print("Error creando webhook:", create_response.json())

if __name__ == "__main__":
    create_paypal_webhook() 
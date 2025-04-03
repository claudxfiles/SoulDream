import os
import requests
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def get_webhook_info():
    # Configuración
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
    mode = os.getenv('PAYPAL_MODE', 'sandbox')
    webhook_id = "8CN77137TB885473L"  # ID correcto del webhook
    
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
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    # Obtener información del webhook específico
    webhook_url = f"{base_url}/v1/notifications/webhooks/{webhook_id}"
    webhook_response = requests.get(webhook_url, headers=headers)
    
    if webhook_response.status_code == 200:
        webhook = webhook_response.json()
        print("\nInformación del Webhook:")
        print(f"ID: {webhook['id']}")
        print(f"URL: {webhook['url']}")
        print("\nEventos configurados:")
        for event in webhook['event_types']:
            print(f"  - {event['name']}")
        
        # Intentar obtener el webhook secret
        verify_url = f"{base_url}/v1/notifications/webhooks/{webhook_id}/verify-signature"
        verify_response = requests.post(
            verify_url,
            headers=headers,
            json={
                "transmission_id": "test",
                "transmission_time": "2024-01-01T00:00:00Z",
                "cert_url": f"{base_url}/v1/notifications/certs/CERT-360caa42-35c2474e",
                "auth_algo": "SHA256withRSA",
                "transmission_sig": "test",
                "webhook_id": webhook_id,
                "webhook_event": {"test": "test"}
            }
        )
        
        if verify_response.status_code == 200:
            webhook_secret = verify_response.json().get('verification_status')
            print("\nVariables para configurar en Railway:")
            print("----------------------------------------")
            print(f"PAYPAL_WEBHOOK_ID={webhook_id}")
            print(f"PAYPAL_WEBHOOK_SECRET={webhook_secret}")
            print("----------------------------------------")
        else:
            print("\nError obteniendo webhook secret:", verify_response.json())
    else:
        print("Error obteniendo información del webhook:", webhook_response.json())

if __name__ == "__main__":
    get_webhook_info() 
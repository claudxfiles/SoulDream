import os
import base64
import requests
from typing import Optional

class PayPalClient:
    def __init__(self):
        self.client_id = os.getenv("PAYPAL_CLIENT_ID")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
        self.mode = os.getenv("PAYPAL_MODE", "sandbox")
        self.api_url = "https://api-m.sandbox.paypal.com" if self.mode == "sandbox" else "https://api-m.paypal.com"

    async def get_access_token(self) -> str:
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        response = requests.post(
            f"{self.api_url}/v1/oauth2/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data="grant_type=client_credentials"
        )
        data = response.json()
        return data["access_token"]

    async def create_subscription(self, plan_id: str, user_email: str, user_name: str) -> dict:
        access_token = await self.get_access_token()
        response = requests.post(
            f"{self.api_url}/v1/billing/subscriptions",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "PayPal-Request-Id": f"{user_email}-{plan_id}-{os.urandom(8).hex()}"
            },
            json={
                "plan_id": plan_id,
                "subscriber": {
                    "name": {
                        "given_name": user_name,
                        "surname": "SoulDream"
                    },
                    "email_address": user_email
                },
                "application_context": {
                    "brand_name": "SoulDream",
                    "locale": "es-ES",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "SUBSCRIBE_NOW",
                    "payment_method": {
                        "payer_selected": "PAYPAL",
                        "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                    },
                    "return_url": f"{os.getenv('FRONTEND_URL')}/subscription/success",
                    "cancel_url": f"{os.getenv('FRONTEND_URL')}/subscription/cancel"
                }
            }
        )
        return response.json()

    async def cancel_subscription(self, subscription_id: str, reason: str) -> None:
        access_token = await self.get_access_token()
        response = requests.post(
            f"{self.api_url}/v1/billing/subscriptions/{subscription_id}/cancel",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            },
            json={"reason": reason}
        )
        if not response.ok:
            response.raise_for_status()

    async def get_subscription_details(self, subscription_id: str) -> dict:
        access_token = await self.get_access_token()
        response = requests.get(
            f"{self.api_url}/v1/billing/subscriptions/{subscription_id}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
        )
        return response.json()

paypal_client = PayPalClient() 
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

router = APIRouter()

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

@router.post("/webhook")
async def paypal_webhook(request: Request, supabase: Client = Depends(get_supabase)):
    try:
        # Obtener los headers necesarios para la verificación
        transmission_id = request.headers.get("Paypal-Transmission-Id")
        timestamp = request.headers.get("Paypal-Transmission-Time")
        webhook_id = os.getenv("PAYPAL_WEBHOOK_ID")
        cert_url = request.headers.get("Paypal-Cert-Url")
        auth_algo = request.headers.get("Paypal-Auth-Algo")
        actual_sig = request.headers.get("Paypal-Transmission-Sig")

        if not all([transmission_id, timestamp, webhook_id, cert_url, auth_algo, actual_sig]):
            raise HTTPException(status_code=400, detail="Missing required PayPal headers")

        # Obtener el cuerpo del evento
        webhook_data = await request.json()
        event_body = json.dumps(webhook_data)
        event_type = webhook_data.get("event_type")

        # Verificar la firma
        is_valid = await verify_paypal_signature(
            transmission_id, timestamp, webhook_id, event_body,
            cert_url, auth_algo, actual_sig
        )

        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid PayPal signature")

        # Handle different webhook events
        match event_type:
            case "BILLING.SUBSCRIPTION.CREATED":
                await handle_subscription_created(webhook_data, supabase)
            
            case "BILLING.SUBSCRIPTION.ACTIVATED":
                await handle_subscription_activated(webhook_data, supabase)
            
            case "BILLING.SUBSCRIPTION.UPDATED":
                await handle_subscription_updated(webhook_data, supabase)
            
            case "BILLING.SUBSCRIPTION.EXPIRED":
                await handle_subscription_expired(webhook_data, supabase)
            
            case "BILLING.SUBSCRIPTION.CANCELLED":
                await handle_subscription_cancelled(webhook_data, supabase)
            
            case "BILLING.SUBSCRIPTION.REACTIVATED":
                await handle_subscription_reactivated(webhook_data, supabase)
            
            case "PAYMENT.SALE.COMPLETED":
                await handle_payment_completed(webhook_data, supabase)
            
            case "PAYMENT.SALE.DENIED":
                await handle_payment_denied(webhook_data, supabase)
            
            case "PAYMENT.SALE.PENDING":
                await handle_payment_pending(webhook_data, supabase)
            
            case _:
                # Log unhandled event type
                print(f"Unhandled webhook event type: {event_type}")

        return {"status": "success"}
    
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_subscription_created(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    # Create new subscription record
    await supabase.table("subscriptions").insert({
        "paypal_subscription_id": subscription_id,
        "status": "created",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }).execute()

async def handle_subscription_activated(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    next_billing_time = data["resource"]["billing_info"]["next_billing_time"]
    
    await supabase.table("subscriptions").update({
        "status": "active",
        "current_period_end": next_billing_time,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_subscription_updated(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    next_billing_time = data["resource"]["billing_info"]["next_billing_time"]
    
    await supabase.table("subscriptions").update({
        "current_period_end": next_billing_time,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_subscription_expired(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    
    await supabase.table("subscriptions").update({
        "status": "expired",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_subscription_cancelled(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    
    await supabase.table("subscriptions").update({
        "status": "cancelled",
        "cancel_at_period_end": True,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_subscription_reactivated(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["id"]
    
    await supabase.table("subscriptions").update({
        "status": "active",
        "cancel_at_period_end": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_payment_completed(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["billing_agreement_id"]
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No subscription ID found")

    subscription = await supabase.table("subscriptions").select(
        "id,user_id,subscription_plan_id"
    ).eq("paypal_subscription_id", subscription_id).single().execute()

    if not subscription.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    await supabase.table("payments").insert({
        "user_id": subscription.data["user_id"],
        "subscription_plan_id": subscription.data["subscription_plan_id"],
        "paypal_order_id": data["resource"]["id"],
        "amount": data["resource"]["amount"]["total"],
        "currency": data["resource"]["amount"]["currency"],
        "status": "completed",
        "created_at": datetime.utcnow().isoformat()
    }).execute()

async def handle_payment_denied(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["billing_agreement_id"]
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No subscription ID found")

    subscription = await supabase.table("subscriptions").select(
        "id,user_id,subscription_plan_id"
    ).eq("paypal_subscription_id", subscription_id).single().execute()

    if not subscription.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Record the failed payment
    await supabase.table("payments").insert({
        "user_id": subscription.data["user_id"],
        "subscription_plan_id": subscription.data["subscription_plan_id"],
        "paypal_order_id": data["resource"]["id"],
        "amount": data["resource"]["amount"]["total"],
        "currency": data["resource"]["amount"]["currency"],
        "status": "failed",
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    # Update subscription status
    await supabase.table("subscriptions").update({
        "status": "payment_failed",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("paypal_subscription_id", subscription_id).execute()

async def handle_payment_pending(data: Dict[Any, Any], supabase: Client):
    subscription_id = data["resource"]["billing_agreement_id"]
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No subscription ID found")

    subscription = await supabase.table("subscriptions").select(
        "id,user_id,subscription_plan_id"
    ).eq("paypal_subscription_id", subscription_id).single().execute()

    if not subscription.data:
        raise HTTPException(status_code=404, detail="Subscription not found")

    await supabase.table("payments").insert({
        "user_id": subscription.data["user_id"],
        "subscription_plan_id": subscription.data["subscription_plan_id"],
        "paypal_order_id": data["resource"]["id"],
        "amount": data["resource"]["amount"]["total"],
        "currency": data["resource"]["amount"]["currency"],
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }).execute() 
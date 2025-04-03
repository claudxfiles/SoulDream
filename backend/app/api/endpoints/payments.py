from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Optional
from app.core.config import settings
from app.db.session import get_db
from sqlalchemy.orm import Session
import hmac
import hashlib
import base64
import json
from datetime import datetime
from app.models.subscription import Subscription, SubscriptionEvent, Payment

router = APIRouter()

async def verify_webhook_signature(
    request: Request,
    webhook_id: str = Header(..., alias="PAYPAL-TRANSMISSION-ID"),
    auth_algo: str = Header(..., alias="PAYPAL-AUTH-ALGO"),
    cert_url: str = Header(..., alias="PAYPAL-CERT-URL"),
    transmission_sig: str = Header(..., alias="PAYPAL-TRANSMISSION-SIG"),
    transmission_time: str = Header(..., alias="PAYPAL-TRANSMISSION-TIME"),
) -> bool:
    """Verifica la firma del webhook de PayPal"""
    
    # Obtener el cuerpo de la solicitud
    body = await request.body()
    
    # Construir la cadena de validación
    validation_str = f"{webhook_id}|{transmission_time}|{settings.PAYPAL_WEBHOOK_ID}|{body.decode()}"
    
    # Calcular la firma
    signature = base64.b64encode(
        hmac.new(
            settings.PAYPAL_WEBHOOK_SECRET.encode(),
            validation_str.encode(),
            hashlib.sha256
        ).digest()
    ).decode()
    
    # Comparar firmas
    return hmac.compare_digest(signature, transmission_sig)

@router.post("/webhook")
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Maneja los webhooks de PayPal"""
    
    # Verificar la firma del webhook
    try:
        is_valid = await verify_webhook_signature(request)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Obtener el cuerpo del webhook
    body = await request.json()
    event_type = body.get("event_type")
    
    # Procesar diferentes tipos de eventos
    if event_type == "PAYMENT.SALE.COMPLETED":
        # Procesar pago completado
        resource = body.get("resource", {})
        subscription_id = resource.get("billing_agreement_id")
        
        if subscription_id:
            # Actualizar el estado de la suscripción
            subscription = db.query(Subscription).filter(
                Subscription.paypal_subscription_id == subscription_id
            ).first()
            
            if subscription:
                # Registrar el pago
                payment = Payment(
                    subscription_id=subscription.id,
                    amount=float(resource.get("amount", {}).get("total", 0)),
                    currency=resource.get("amount", {}).get("currency", "USD"),
                    payment_id=resource.get("id"),
                    status="completed",
                    provider="paypal",
                    provider_payment_id=resource.get("id"),
                    payment_method="paypal",
                    metadata=resource
                )
                db.add(payment)
                
                # Registrar el evento
                event = SubscriptionEvent(
                    subscription_id=subscription.id,
                    event_type="payment_completed",
                    metadata={
                        "payment_id": resource.get("id"),
                        "amount": resource.get("amount"),
                        "raw_event": body
                    }
                )
                db.add(event)
                
                try:
                    db.commit()
                except Exception as e:
                    db.rollback()
                    raise HTTPException(status_code=500, detail=str(e))
    
    elif event_type == "BILLING.SUBSCRIPTION.CREATED":
        # Procesar suscripción creada
        resource = body.get("resource", {})
        subscription_id = resource.get("id")
        
        if subscription_id:
            subscription = db.query(Subscription).filter(
                Subscription.paypal_subscription_id == subscription_id
            ).first()
            
            if subscription:
                # Actualizar estado si es necesario
                subscription.status = "active"
                
                # Registrar el evento
                event = SubscriptionEvent(
                    subscription_id=subscription.id,
                    event_type="subscription_created",
                    metadata={"raw_event": body}
                )
                db.add(event)
                
                try:
                    db.commit()
                except Exception as e:
                    db.rollback()
                    raise HTTPException(status_code=500, detail=str(e))
    
    # Agregar más tipos de eventos según sea necesario
    
    return {"status": "success"} 
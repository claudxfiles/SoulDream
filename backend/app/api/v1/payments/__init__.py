from fastapi import APIRouter
from . import webhook, create_subscription, cancel_subscription, success

router = APIRouter()

router.include_router(webhook.router, tags=["payments"])
router.include_router(create_subscription.router, tags=["payments"])
router.include_router(cancel_subscription.router, tags=["payments"])
router.include_router(success.router, tags=["payments"]) 
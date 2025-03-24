from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.services.subscription_service import SubscriptionService
from app.schemas.subscription import Subscription, SubscriptionCreate, SubscriptionUpdate
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Subscription)
def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Subscription:
    return SubscriptionService.create_subscription(
        db=db, user_id=current_user.id, subscription=subscription
    )

@router.get("/", response_model=List[Subscription])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Subscription]:
    return SubscriptionService.get_subscriptions(db=db, user_id=current_user.id)

@router.get("/{subscription_id}", response_model=Subscription)
def get_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Subscription:
    subscription = SubscriptionService.get_subscription(
        db=db, user_id=current_user.id, subscription_id=subscription_id
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return subscription

@router.put("/{subscription_id}", response_model=Subscription)
def update_subscription(
    subscription_id: str,
    subscription_update: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Subscription:
    db_subscription = SubscriptionService.get_subscription(
        db=db, user_id=current_user.id, subscription_id=subscription_id
    )
    if not db_subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return SubscriptionService.update_subscription(
        db=db,
        db_subscription=db_subscription,
        subscription_update=subscription_update
    )

@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    db_subscription = SubscriptionService.get_subscription(
        db=db, user_id=current_user.id, subscription_id=subscription_id
    )
    if not db_subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    SubscriptionService.delete_subscription(db=db, db_subscription=db_subscription)

@router.post("/{subscription_id}/toggle", response_model=Subscription)
def toggle_subscription_status(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Subscription:
    db_subscription = SubscriptionService.get_subscription(
        db=db, user_id=current_user.id, subscription_id=subscription_id
    )
    if not db_subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    return SubscriptionService.toggle_subscription_status(
        db=db, db_subscription=db_subscription
    ) 
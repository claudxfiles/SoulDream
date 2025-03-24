from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate
import uuid

class SubscriptionService:
    @staticmethod
    def create_subscription(db: Session, *, user_id: str, subscription: SubscriptionCreate) -> Subscription:
        db_subscription = Subscription(
            id=str(uuid.uuid4()),
            user_id=user_id,
            **subscription.model_dump()
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription

    @staticmethod
    def get_subscriptions(db: Session, user_id: str) -> List[Subscription]:
        return db.query(Subscription).filter(Subscription.user_id == user_id).all()

    @staticmethod
    def get_subscription(db: Session, user_id: str, subscription_id: str) -> Optional[Subscription]:
        return db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.id == subscription_id
        ).first()

    @staticmethod
    def update_subscription(
        db: Session,
        *,
        db_subscription: Subscription,
        subscription_update: SubscriptionUpdate
    ) -> Subscription:
        update_data = subscription_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_subscription, field, value)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription

    @staticmethod
    def delete_subscription(db: Session, *, db_subscription: Subscription) -> None:
        db.delete(db_subscription)
        db.commit()

    @staticmethod
    def toggle_subscription_status(db: Session, *, db_subscription: Subscription) -> Subscription:
        db_subscription.status = "cancelled" if db_subscription.status == "active" else "active"
        db.commit()
        db.refresh(db_subscription)
        return db_subscription 
from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, Field, UUID4
from enum import Enum

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    PENDING = "pending"
    SUSPENDED = "suspended"

class PlanInterval(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class SubscriptionPlanBase(BaseModel):
    name: str
    description: str
    price: float
    currency: str = "USD"
    interval: PlanInterval
    features: List[str]

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    plan_id: UUID4
    user_id: UUID4

class SubscriptionCreate(SubscriptionBase):
    paypal_subscription_id: Optional[str] = None
    cancel_at_period_end: bool = False

class SubscriptionUpdate(BaseModel):
    status: Optional[SubscriptionStatus] = None
    cancel_at_period_end: Optional[bool] = None
    cancellation_reason: Optional[str] = None

class SubscriptionResponse(SubscriptionBase):
    id: UUID4
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    plan: SubscriptionPlanResponse

    class Config:
        from_attributes = True

class SubscriptionDetails(BaseModel):
    plan_value: float
    member_since: datetime
    plan_type: str
    plan_interval: PlanInterval
    plan_currency: str
    plan_status: SubscriptionStatus
    subscription_date: datetime
    plan_validity_end: datetime
    plan_features: List[str]

    class Config:
        from_attributes = True 
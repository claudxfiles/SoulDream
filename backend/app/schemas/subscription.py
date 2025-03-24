from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SubscriptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    amount: float = Field(gt=0)
    currency: str = "USD"
    billing_cycle: str = Field(pattern="^(monthly|annual)$")
    next_billing_date: datetime
    category: str
    status: str = Field(pattern="^(active|cancelled|pending)$", default="active")
    auto_renewal: bool = True
    payment_method: str

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    billing_cycle: Optional[str] = Field(None, pattern="^(monthly|annual)$")
    next_billing_date: Optional[datetime] = None
    category: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|cancelled|pending)$")
    auto_renewal: Optional[bool] = None
    payment_method: Optional[str] = None

class SubscriptionInDB(SubscriptionBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Subscription(SubscriptionInDB):
    pass 
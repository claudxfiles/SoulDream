from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("auth.users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    billing_cycle = Column(String, nullable=False)  # 'monthly' or 'annual'
    next_billing_date = Column(DateTime, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")  # 'active', 'cancelled', 'pending'
    auto_renewal = Column(Boolean, nullable=False, default=True)
    payment_method = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 
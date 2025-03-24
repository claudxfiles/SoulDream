from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import date, datetime
from enum import Enum

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category: str
    description: Optional[str] = None
    date: Union[date, str] = None
    payment_method: Optional[str] = None

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[Union[date, str]] = None
    payment_method: Optional[str] = None

class Transaction(BaseModel):
    id: str
    user_id: str
    amount: float
    type: TransactionType
    category: str
    description: Optional[str] = None
    date: Union[date, str]
    payment_method: Optional[str] = None
    created_at: Union[datetime, str]
    updated_at: Union[datetime, str]
    is_deleted: bool = False

    class Config:
        from_attributes = True

class FinancialGoalCreate(BaseModel):
    title: str
    target_amount: float
    current_amount: Optional[float] = 0
    deadline: Optional[Union[date, str]] = None
    category: Optional[str] = None
    description: Optional[str] = None

class FinancialGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[Union[date, str]] = None
    category: Optional[str] = None
    description: Optional[str] = None

class FinancialGoal(BaseModel):
    id: str
    user_id: str
    title: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[Union[date, str]] = None
    category: Optional[str] = None
    description: Optional[str] = None
    created_at: Union[datetime, str]
    updated_at: Union[datetime, str]
    is_deleted: bool = False

    class Config:
        from_attributes = True 
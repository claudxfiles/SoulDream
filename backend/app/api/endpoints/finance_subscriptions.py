from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_db, get_current_user
from sqlalchemy.orm import Session
from app.models.user import User
from pydantic import BaseModel, UUID4
from datetime import datetime
import uuid

router = APIRouter()

# Esquemas Pydantic
class SubscriptionBase(BaseModel):
    name: str
    amount: float
    currency: str = "USD"
    billing_cycle: str
    category: str
    notes: Optional[str] = None
    auto_renewal: bool = True
    payment_method: Optional[str] = None
    status: str = "active"
    next_billing_date: datetime

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    auto_renewal: Optional[bool] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    next_billing_date: Optional[datetime] = None

class Subscription(SubscriptionBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Endpoints
@router.post("/", response_model=Subscription, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva suscripción financiera"""
    # Crear objeto con los datos para insertar en Supabase
    subscription_data = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        **subscription.model_dump(),
    }
    
    # Insertar en Supabase directamente
    query = db.execute(
        """
        INSERT INTO subscriptions_tracker 
        (id, user_id, name, amount, currency, billing_cycle, category, notes, 
        auto_renewal, payment_method, status, next_billing_date)
        VALUES 
        (:id, :user_id, :name, :amount, :currency, :billing_cycle, :category, :notes,
        :auto_renewal, :payment_method, :status, :next_billing_date)
        RETURNING *
        """,
        subscription_data
    )
    
    # Obtener resultado
    result = query.fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la suscripción"
        )
    
    # Convertir resultado a un diccionario
    subscription_dict = {column: getattr(result, column) for column in result._fields}
    
    return subscription_dict

@router.get("/", response_model=List[Subscription])
async def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las suscripciones financieras del usuario"""
    query = db.execute(
        """
        SELECT * FROM subscriptions_tracker
        WHERE user_id = :user_id
        ORDER BY next_billing_date ASC
        """,
        {"user_id": str(current_user.id)}
    )
    
    results = query.fetchall()
    
    # Convertir resultados a diccionarios
    subscriptions = []
    for row in results:
        subscription_dict = {column: getattr(row, column) for column in row._fields}
        subscriptions.append(subscription_dict)
    
    return subscriptions

@router.get("/{subscription_id}", response_model=Subscription)
async def get_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener una suscripción financiera específica"""
    query = db.execute(
        """
        SELECT * FROM subscriptions_tracker
        WHERE id = :id AND user_id = :user_id
        """,
        {"id": subscription_id, "user_id": str(current_user.id)}
    )
    
    result = query.fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada"
        )
    
    # Convertir resultado a un diccionario
    subscription_dict = {column: getattr(result, column) for column in result._fields}
    
    return subscription_dict

@router.put("/{subscription_id}", response_model=Subscription)
async def update_subscription(
    subscription_id: str,
    subscription: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una suscripción financiera"""
    # Verificar que la suscripción existe y pertenece al usuario
    query = db.execute(
        """
        SELECT * FROM subscriptions_tracker
        WHERE id = :id AND user_id = :user_id
        """,
        {"id": subscription_id, "user_id": str(current_user.id)}
    )
    
    result = query.fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada"
        )
    
    # Filtrar campos no nulos para actualizar
    update_data = {k: v for k, v in subscription.model_dump().items() if v is not None}
    
    if not update_data:
        # Si no hay datos para actualizar, devolver la suscripción actual
        subscription_dict = {column: getattr(result, column) for column in result._fields}
        return subscription_dict
    
    # Construir la consulta de actualización dinámicamente
    set_clause = ", ".join([f"{k} = :{k}" for k in update_data.keys()])
    update_data["id"] = subscription_id
    update_data["user_id"] = str(current_user.id)
    
    query = db.execute(
        f"""
        UPDATE subscriptions_tracker
        SET {set_clause}
        WHERE id = :id AND user_id = :user_id
        RETURNING *
        """,
        update_data
    )
    
    updated_result = query.fetchone()
    
    if not updated_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la suscripción"
        )
    
    # Convertir resultado a un diccionario
    subscription_dict = {column: getattr(updated_result, column) for column in updated_result._fields}
    
    return subscription_dict

@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una suscripción financiera"""
    # Verificar que la suscripción existe y pertenece al usuario
    query = db.execute(
        """
        SELECT * FROM subscriptions_tracker
        WHERE id = :id AND user_id = :user_id
        """,
        {"id": subscription_id, "user_id": str(current_user.id)}
    )
    
    result = query.fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada"
        )
    
    # Eliminar la suscripción
    db.execute(
        """
        DELETE FROM subscriptions_tracker
        WHERE id = :id AND user_id = :user_id
        """,
        {"id": subscription_id, "user_id": str(current_user.id)}
    )
    
    db.commit()
    
    return None

@router.post("/{subscription_id}/toggle", response_model=Subscription)
async def toggle_subscription_status(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alternar el estado de una suscripción entre 'active' y 'cancelled'"""
    # Obtener la suscripción
    query = db.execute(
        """
        SELECT * FROM subscriptions_tracker
        WHERE id = :id AND user_id = :user_id
        """,
        {"id": subscription_id, "user_id": str(current_user.id)}
    )
    
    result = query.fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suscripción no encontrada"
        )
    
    # Determinar el nuevo estado
    current_status = getattr(result, "status")
    new_status = "cancelled" if current_status == "active" else "active"
    
    # Actualizar el estado
    query = db.execute(
        """
        UPDATE subscriptions_tracker
        SET status = :status
        WHERE id = :id AND user_id = :user_id
        RETURNING *
        """,
        {"id": subscription_id, "user_id": str(current_user.id), "status": new_status}
    )
    
    updated_result = query.fetchone()
    
    if not updated_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el estado de la suscripción"
        )
    
    # Convertir resultado a un diccionario
    subscription_dict = {column: getattr(updated_result, column) for column in updated_result._fields}
    
    return subscription_dict 
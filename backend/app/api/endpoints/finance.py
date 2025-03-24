from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Optional
from datetime import datetime
import uuid

from app.services.auth import get_current_user
from app.schemas.user import User
from app.schemas.finance import Transaction, TransactionCreate, TransactionUpdate, FinancialGoal, FinancialGoalCreate, FinancialGoalUpdate
from app.db.database import get_supabase_client

router = APIRouter()

# Endpoints para transacciones
@router.get("/transactions/", response_model=List[Transaction])
async def read_transactions(
    transaction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene todas las transacciones del usuario actual
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("transactions") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False)
        
        if transaction_type:
            query = query.eq("type", transaction_type)
        
        response = query.execute()
        
        if not response.data:
            return []
        
        return [Transaction(**transaction) for transaction in response.data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener transacciones: {str(e)}"
        )

@router.post("/transactions/", response_model=Transaction)
async def create_transaction(
    transaction_in: TransactionCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea una nueva transacción
    """
    supabase = get_supabase_client()
    
    try:
        # Crear un objeto con todos los campos necesarios
        transaction_data = transaction_in.dict()
        transaction_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        transaction_db = {
            **transaction_data,
            "id": transaction_id,
            "user_id": current_user.id,
            "created_at": now,
            "updated_at": now,
            "is_deleted": False
        }
        
        response = supabase.table("transactions").insert(transaction_db).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear la transacción"
            )
        
        return Transaction(**response.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la transacción: {str(e)}"
        )

@router.get("/transactions/{transaction_id}", response_model=Transaction)
async def read_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene una transacción específica por ID
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("transactions") \
            .select("*") \
            .eq("id", transaction_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transacción no encontrada"
            )
        
        return Transaction(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la transacción: {str(e)}"
        )

@router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    transaction_in: TransactionUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Actualiza una transacción específica
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la transacción existe y pertenece al usuario
        get_response = supabase.table("transactions") \
            .select("*") \
            .eq("id", transaction_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not get_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transacción no encontrada"
            )
        
        # Actualizar la transacción
        transaction_data = transaction_in.dict(exclude_unset=True)
        transaction_data["updated_at"] = datetime.utcnow().isoformat()
        
        update_response = supabase.table("transactions") \
            .update(transaction_data) \
            .eq("id", transaction_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar la transacción"
            )
        
        return Transaction(**update_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la transacción: {str(e)}"
        )

@router.delete("/transactions/{transaction_id}", response_model=Transaction)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Elimina (soft delete) una transacción específica
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la transacción existe y pertenece al usuario
        get_response = supabase.table("transactions") \
            .select("*") \
            .eq("id", transaction_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not get_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transacción no encontrada"
            )
        
        # Realizar soft delete de la transacción
        delete_data = {
            "is_deleted": True,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        delete_response = supabase.table("transactions") \
            .update(delete_data) \
            .eq("id", transaction_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar la transacción"
            )
        
        return Transaction(**delete_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la transacción: {str(e)}"
        )

# Endpoints para metas financieras
@router.get("/goals/", response_model=List[FinancialGoal])
async def read_financial_goals(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene todas las metas financieras del usuario actual
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("finance_goals") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not response.data:
            return []
        
        return [FinancialGoal(**goal) for goal in response.data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener metas financieras: {str(e)}"
        )

@router.post("/goals/", response_model=FinancialGoal)
async def create_financial_goal(
    goal_in: FinancialGoalCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea una nueva meta financiera
    """
    supabase = get_supabase_client()
    
    try:
        # Crear un objeto con todos los campos necesarios
        goal_data = goal_in.dict()
        goal_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        goal_db = {
            **goal_data,
            "id": goal_id,
            "user_id": current_user.id,
            "created_at": now,
            "updated_at": now,
            "is_deleted": False,
            "current_amount": goal_data.get("current_amount", 0)
        }
        
        response = supabase.table("finance_goals").insert(goal_db).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear la meta financiera"
            )
        
        return FinancialGoal(**response.data[0])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la meta financiera: {str(e)}"
        )

@router.put("/goals/{goal_id}", response_model=FinancialGoal)
async def update_financial_goal(
    goal_id: str,
    goal_in: FinancialGoalUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Actualiza una meta financiera específica
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la meta existe y pertenece al usuario
        get_response = supabase.table("finance_goals") \
            .select("*") \
            .eq("id", goal_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not get_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meta financiera no encontrada"
            )
        
        # Actualizar la meta
        goal_data = goal_in.dict(exclude_unset=True)
        goal_data["updated_at"] = datetime.utcnow().isoformat()
        
        update_response = supabase.table("finance_goals") \
            .update(goal_data) \
            .eq("id", goal_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar la meta financiera"
            )
        
        return FinancialGoal(**update_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la meta financiera: {str(e)}"
        )

@router.delete("/goals/{goal_id}", response_model=FinancialGoal)
async def delete_financial_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Elimina (soft delete) una meta financiera específica
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la meta existe y pertenece al usuario
        get_response = supabase.table("finance_goals") \
            .select("*") \
            .eq("id", goal_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not get_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meta financiera no encontrada"
            )
        
        # Realizar soft delete de la meta
        delete_data = {
            "is_deleted": True,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        delete_response = supabase.table("finance_goals") \
            .update(delete_data) \
            .eq("id", goal_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar la meta financiera"
            )
        
        return FinancialGoal(**delete_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar la meta financiera: {str(e)}"
        )

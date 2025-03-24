from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Optional
from datetime import datetime
import uuid

from app.services.auth import get_current_user
from app.schemas.user import User
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.db.database import get_supabase_client

router = APIRouter()

@router.get("/", response_model=List[Task])
async def read_tasks(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene todas las tareas del usuario actual
    """
    supabase = get_supabase_client()
    
    try:
        query = supabase.table("tasks") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False)
        
        if status:
            query = query.eq("status", status)
        
        response = query.order("column_order", desc=False).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener tareas: {str(e)}"
        )

@router.post("/", response_model=Task)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea una nueva tarea
    """
    supabase = get_supabase_client()
    
    try:
        # Obtener el orden máximo actual para la columna
        max_order_response = supabase.table("tasks") \
            .select("column_order") \
            .eq("user_id", current_user.id) \
            .eq("status", task_in.status) \
            .eq("is_deleted", False) \
            .order("column_order", desc=True) \
            .limit(1) \
            .execute()
        
        max_order = 0
        if max_order_response.data:
            max_order = max_order_response.data[0].get("column_order", 0)
        
        # Crear la tarea
        task_data = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "title": task_in.title,
            "description": task_in.description,
            "status": task_in.status,
            "priority": task_in.priority,
            "due_date": task_in.due_date.isoformat() if task_in.due_date else None,
            "tags": task_in.tags,
            "column_order": max_order + 1,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "is_deleted": False
        }
        
        response = supabase.table("tasks").insert(task_data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear la tarea"
            )
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear tarea: {str(e)}"
        )

@router.get("/{task_id}", response_model=Task)
async def read_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene una tarea específica
    """
    supabase = get_supabase_client()
    
    try:
        response = supabase.table("tasks") \
            .select("*") \
            .eq("id", task_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener tarea: {str(e)}"
        )

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Actualiza una tarea
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la tarea existe y pertenece al usuario
        task_response = supabase.table("tasks") \
            .select("*") \
            .eq("id", task_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not task_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        # Preparar datos para actualizar
        update_data = {k: v for k, v in task_in.dict(exclude_unset=True).items()}
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Si hay una fecha de vencimiento, convertirla a ISO
        if "due_date" in update_data and update_data["due_date"]:
            update_data["due_date"] = update_data["due_date"].isoformat()
        
        # Actualizar la tarea
        response = supabase.table("tasks") \
            .update(update_data) \
            .eq("id", task_id) \
            .execute()
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar tarea: {str(e)}"
        )

@router.delete("/{task_id}", response_model=Task)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Elimina una tarea (marcándola como eliminada)
    """
    supabase = get_supabase_client()
    
    try:
        # Verificar que la tarea existe y pertenece al usuario
        task_response = supabase.table("tasks") \
            .select("*") \
            .eq("id", task_id) \
            .eq("user_id", current_user.id) \
            .eq("is_deleted", False) \
            .execute()
        
        if not task_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarea no encontrada"
            )
        
        # Marcar como eliminada
        response = supabase.table("tasks") \
            .update({
                "is_deleted": True,
                "updated_at": datetime.now().isoformat()
            }) \
            .eq("id", task_id) \
            .execute()
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar tarea: {str(e)}"
        )

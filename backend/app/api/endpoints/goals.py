from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import uuid4

from app.api.deps import get_current_user
from app.schemas.goal import GoalCreate, GoalUpdate, Goal

router = APIRouter()

@router.get("/", response_model=List[Goal])
def get_goals(
    current_user=Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    area: Optional[str] = None
):
    """
    Obtiene todas las metas del usuario actual.
    Si se especifica el área, filtra las metas por área.
    """
    # Aquí iría la lógica para obtener las metas desde Supabase
    # Por ahora, devolvemos una lista vacía
    return []

@router.post("/", response_model=Goal, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal: GoalCreate,
    current_user=Depends(get_current_user)
):
    """
    Crea una nueva meta para el usuario actual.
    """
    # Aquí iría la lógica para crear una meta en Supabase
    # Por ahora, devolvemos un objeto simulado
    return {
        "id": str(uuid4()),
        "user_id": current_user["id"],
        "title": goal.title,
        "description": goal.description,
        "area": goal.area,
        "target_date": goal.target_date,
        "progress_percentage": 0,
        "status": "active",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z",
        "priority": goal.priority,
        "type": goal.type
    }

@router.get("/{goal_id}", response_model=Goal)
def get_goal(
    goal_id: str,
    current_user=Depends(get_current_user)
):
    """
    Obtiene una meta específica por ID.
    """
    # Aquí iría la lógica para obtener la meta desde Supabase
    # Por ahora, devolvemos un error 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Meta no encontrada"
    )

@router.put("/{goal_id}", response_model=Goal)
def update_goal(
    goal_id: str,
    goal: GoalUpdate,
    current_user=Depends(get_current_user)
):
    """
    Actualiza una meta específica por ID.
    """
    # Aquí iría la lógica para actualizar la meta en Supabase
    # Por ahora, devolvemos un error 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Meta no encontrada"
    )

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    current_user=Depends(get_current_user)
):
    """
    Elimina una meta específica por ID.
    """
    # Aquí iría la lógica para eliminar la meta en Supabase
    # Por ahora, devolvemos un error 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Meta no encontrada"
    ) 
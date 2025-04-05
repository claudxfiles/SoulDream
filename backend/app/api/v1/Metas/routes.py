from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.deps import get_current_user
from .controller import GoalsController
from .types import Goal, GoalCreate, GoalUpdate, GoalStep, GoalStepCreate, GoalStepUpdate

router = APIRouter()

@router.get("/", response_model=List[Goal])
async def get_goals(current_user: dict = Depends(get_current_user)):
    """
    Obtener todas las metas del usuario actual.
    """
    return await GoalsController.get_goals(current_user['id'])

@router.get("/{goal_id}", response_model=Goal)
async def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener una meta específica por ID.
    """
    return await GoalsController.get_goal(goal_id, current_user['id'])

@router.post("/", response_model=Goal)
async def create_goal(
    goal: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear una nueva meta.
    """
    goal.user_id = current_user['id']
    return await GoalsController.create_goal(goal)

@router.put("/{goal_id}", response_model=Goal)
async def update_goal(
    goal_id: str,
    goal: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar una meta existente.
    """
    return await GoalsController.update_goal(goal_id, goal, current_user['id'])

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Eliminar una meta.
    """
    return await GoalsController.delete_goal(goal_id, current_user['id'])

@router.get("/{goal_id}/steps", response_model=List[GoalStep])
async def get_goal_steps(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtener todos los pasos de una meta.
    """
    return await GoalsController.get_goal_steps(goal_id, current_user['id'])

@router.post("/{goal_id}/steps", response_model=GoalStep)
async def create_goal_step(
    goal_id: str,
    step: GoalStepCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crear un nuevo paso para una meta.
    """
    step.goal_id = goal_id
    return await GoalsController.create_goal_step(step, current_user['id'])

@router.put("/{goal_id}/steps/{step_id}", response_model=GoalStep)
async def update_goal_step(
    goal_id: str,
    step_id: str,
    step: GoalStepUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualizar un paso existente de una meta.
    """
    return await GoalsController.update_goal_step(step_id, step, current_user['id'])

@router.delete("/{goal_id}/steps/{step_id}")
async def delete_goal_step(
    goal_id: str,
    step_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Eliminar un paso de una meta.
    """
    return await GoalsController.delete_goal_step(step_id, current_user['id']) 
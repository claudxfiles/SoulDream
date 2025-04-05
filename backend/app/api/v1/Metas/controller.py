from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime
from app.db.database import get_supabase_client
from .types import Goal, GoalCreate, GoalUpdate, GoalStep, GoalStepCreate, GoalStepUpdate

class GoalsController:
    @staticmethod
    async def get_goals(user_id: str) -> List[Goal]:
        supabase = get_supabase_client()
        response = supabase.table('goals').select('*').eq('user_id', user_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data

    @staticmethod
    async def get_goal(goal_id: str, user_id: str) -> Goal:
        supabase = get_supabase_client()
        response = supabase.table('goals').select('*').eq('id', goal_id).eq('user_id', user_id).single().execute()
        
        if response.error:
            raise HTTPException(status_code=404, detail="Meta no encontrada")
        
        return response.data

    @staticmethod
    async def create_goal(goal: GoalCreate) -> Goal:
        supabase = get_supabase_client()
        
        goal_data = goal.dict()
        goal_data['created_at'] = datetime.utcnow()
        goal_data['updated_at'] = datetime.utcnow()
        
        response = supabase.table('goals').insert(goal_data).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data[0]

    @staticmethod
    async def update_goal(goal_id: str, goal: GoalUpdate, user_id: str) -> Goal:
        supabase = get_supabase_client()
        
        # Verificar que la meta existe y pertenece al usuario
        existing = await GoalsController.get_goal(goal_id, user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Meta no encontrada")
        
        update_data = goal.dict(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow()
        
        response = supabase.table('goals').update(update_data).eq('id', goal_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data[0]

    @staticmethod
    async def delete_goal(goal_id: str, user_id: str) -> bool:
        supabase = get_supabase_client()
        
        # Verificar que la meta existe y pertenece al usuario
        existing = await GoalsController.get_goal(goal_id, user_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Meta no encontrada")
        
        response = supabase.table('goals').delete().eq('id', goal_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return True

    @staticmethod
    async def get_goal_steps(goal_id: str, user_id: str) -> List[GoalStep]:
        supabase = get_supabase_client()
        
        # Verificar que la meta existe y pertenece al usuario
        await GoalsController.get_goal(goal_id, user_id)
        
        response = supabase.table('goal_steps').select('*').eq('goal_id', goal_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data

    @staticmethod
    async def create_goal_step(step: GoalStepCreate, user_id: str) -> GoalStep:
        supabase = get_supabase_client()
        
        # Verificar que la meta existe y pertenece al usuario
        await GoalsController.get_goal(step.goal_id, user_id)
        
        step_data = step.dict()
        step_data['created_at'] = datetime.utcnow()
        step_data['updated_at'] = datetime.utcnow()
        
        response = supabase.table('goal_steps').insert(step_data).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data[0]

    @staticmethod
    async def update_goal_step(step_id: str, step: GoalStepUpdate, user_id: str) -> GoalStep:
        supabase = get_supabase_client()
        
        # Obtener el paso actual
        step_response = supabase.table('goal_steps').select('*').eq('id', step_id).single().execute()
        if step_response.error or not step_response.data:
            raise HTTPException(status_code=404, detail="Paso no encontrado")
            
        # Verificar que la meta pertenece al usuario
        await GoalsController.get_goal(step_response.data['goal_id'], user_id)
        
        update_data = step.dict(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow()
        
        response = supabase.table('goal_steps').update(update_data).eq('id', step_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return response.data[0]

    @staticmethod
    async def delete_goal_step(step_id: str, user_id: str) -> bool:
        supabase = get_supabase_client()
        
        # Obtener el paso actual
        step_response = supabase.table('goal_steps').select('*').eq('id', step_id).single().execute()
        if step_response.error or not step_response.data:
            raise HTTPException(status_code=404, detail="Paso no encontrado")
            
        # Verificar que la meta pertenece al usuario
        await GoalsController.get_goal(step_response.data['goal_id'], user_id)
        
        response = supabase.table('goal_steps').delete().eq('id', step_id).execute()
        
        if response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        return True 
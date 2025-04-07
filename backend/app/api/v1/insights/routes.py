from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.auth import get_current_user
from app.db.database import get_supabase_client
from datetime import datetime, timedelta
from app.schemas.ai import AIInsight
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[AIInsight])
async def get_insights(current_user: dict = Depends(get_current_user)):
    """
    Obtiene los insights del usuario, incluyendo:
    - Productividad (tareas completadas)
    - Finanzas (gastos)
    - Hábitos (rachas)
    """
    try:
        supabase = get_supabase_client()
        insights = []
        
        # Obtener el ID del usuario del token JWT
        user_id = current_user.get("sub")
        if not user_id:
            logger.error("No se pudo obtener el ID del usuario del token")
            raise HTTPException(
                status_code=401,
                detail="No se pudo autenticar al usuario"
            )
        
        # 1. Tareas de alta prioridad completadas
        try:
            tasks_this_week = supabase.table('tasks').select('id').eq('user_id', user_id)\
                .eq('priority', 'high')\
                .eq('status', 'completed')\
                .execute()
                
            if tasks_this_week.data:
                tasks_count = len(tasks_this_week.data)
                insights.append({
                    "id": "1",
                    "user_id": user_id,
                    "insight_type": "productivity",
                    "description": f"Has completado {tasks_count} tareas de alta prioridad",
                    "data": {
                        "completedTasks": tasks_count
                    },
                    "relevance": 80,
                    "created_at": datetime.now().isoformat()
                })
        except Exception as e:
            logger.warning(f"Error al obtener tareas: {str(e)}")
            
        # 2. Gastos totales
        try:
            expenses = supabase.table('transactions').select('amount')\
                .eq('user_id', user_id)\
                .eq('type', 'expense')\
                .execute()
                
            if expenses.data:
                total_expenses = sum([t['amount'] for t in expenses.data])
                insights.append({
                    "id": "2",
                    "user_id": user_id,
                    "insight_type": "financial",
                    "description": f"Has registrado gastos por un total de ${total_expenses}",
                    "data": {
                        "totalExpenses": total_expenses
                    },
                    "relevance": 75,
                    "created_at": datetime.now().isoformat()
                })
        except Exception as e:
            logger.warning(f"Error al obtener transacciones: {str(e)}")
            
        # 3. Hábitos activos
        try:
            habits = supabase.table('habits').select('id,title')\
                .eq('user_id', user_id)\
                .execute()
                
            if habits.data:
                habits_count = len(habits.data)
                insights.append({
                    "id": "3",
                    "user_id": user_id,
                    "insight_type": "habits",
                    "description": f"Tienes {habits_count} hábitos activos",
                    "data": {
                        "habitsCount": habits_count,
                        "habits": [h['title'] for h in habits.data]
                    },
                    "relevance": 85,
                    "created_at": datetime.now().isoformat()
                })
        except Exception as e:
            logger.warning(f"Error al obtener hábitos: {str(e)}")
        
        # Si no hay insights, devolver un insight genérico
        if not insights:
            insights.append({
                "id": "default",
                "user_id": user_id,
                "insight_type": "productivity",
                "description": "¡Bienvenido! Comienza a registrar tus actividades para obtener insights personalizados.",
                "data": {
                    "message": "Bienvenido",
                    "completedTasks": 0
                },
                "relevance": 50,
                "created_at": datetime.now().isoformat()
            })
        
        return insights
        
    except Exception as e:
        logger.error(f"Error en get_insights: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Error al obtener los insights. Por favor, inténtalo de nuevo más tarde."
        ) 
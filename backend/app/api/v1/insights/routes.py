from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.ai import AIInsight
from app.db.database import get_supabase_client
from app.api.deps import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/", response_model=List[AIInsight])
async def get_insights(user_id: str = Depends(get_current_user)):
    """
    Obtiene los insights del usuario, incluyendo:
    - Productividad (tareas completadas)
    - Finanzas (gastos)
    - Hábitos (rachas)
    """
    try:
        supabase = get_supabase_client()
        
        # Obtener fecha de inicio de esta semana y la semana pasada
        today = datetime.now()
        start_of_this_week = today - timedelta(days=today.weekday())
        start_of_last_week = start_of_this_week - timedelta(days=7)
        
        # 1. Tareas de alta prioridad completadas
        tasks_this_week = supabase.table('tasks').select('id').eq('user_id', user_id)\
            .eq('priority', 'high')\
            .eq('status', 'completed')\
            .gte('completed_at', start_of_this_week.isoformat())\
            .lt('completed_at', start_of_this_week + timedelta(days=7))\
            .execute()
            
        tasks_last_week = supabase.table('tasks').select('id').eq('user_id', user_id)\
            .eq('priority', 'high')\
            .eq('status', 'completed')\
            .gte('completed_at', start_of_last_week.isoformat())\
            .lt('completed_at', start_of_last_week + timedelta(days=7))\
            .execute()
            
        tasks_this_week_count = len(tasks_this_week.data)
        tasks_last_week_count = len(tasks_last_week.data)
        tasks_improvement = ((tasks_this_week_count - tasks_last_week_count) / max(tasks_last_week_count, 1)) * 100 if tasks_last_week_count > 0 else 50
        
        # 2. Gastos en ocio
        expenses_this_month = supabase.table('transactions').select('amount')\
            .eq('user_id', user_id)\
            .eq('type', 'expense')\
            .eq('category', 'ocio')\
            .gte('date', datetime.now().replace(day=1).isoformat())\
            .execute()
            
        expenses_last_month = supabase.table('transactions').select('amount')\
            .eq('user_id', user_id)\
            .eq('type', 'expense')\
            .eq('category', 'ocio')\
            .gte('date', (datetime.now().replace(day=1) - timedelta(days=30)).isoformat())\
            .lt('date', datetime.now().replace(day=1).isoformat())\
            .execute()
            
        expenses_this_month_total = sum([t['amount'] for t in expenses_this_month.data])
        expenses_last_month_total = sum([t['amount'] for t in expenses_last_month.data])
        expense_reduction = ((expenses_last_month_total - expenses_this_month_total) / expenses_last_month_total) * 100 if expenses_last_month_total > 0 else 0
        
        # 3. Hábito de meditación
        meditation_habit = supabase.table('habits').select('id')\
            .eq('user_id', user_id)\
            .eq('title', 'Meditación')\
            .single()\
            .execute()
            
        if meditation_habit.data:
            habit_logs = supabase.table('habit_logs').select('completed_date')\
                .eq('habit_id', meditation_habit.data['id'])\
                .order('completed_date', desc=True)\
                .limit(14)\
                .execute()
                
            # Calcular racha actual
            streak = 0
            for i, log in enumerate(sorted(habit_logs.data, key=lambda x: x['completed_date'], reverse=True)):
                if (datetime.now() - datetime.fromisoformat(log['completed_date'])).days == i:
                    streak += 1
                else:
                    break
        
        # Crear los insights
        insights = [
            {
                "id": "1",
                "user_id": user_id,
                "insight_type": "productivity",
                "description": "Has completado más tareas de alta prioridad esta semana que la semana pasada",
                "data": {
                    "thisWeek": tasks_this_week_count,
                    "lastWeek": tasks_last_week_count,
                    "improvement": round(tasks_improvement)
                },
                "relevance": 80,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "2",
                "user_id": user_id,
                "insight_type": "financial",
                "description": "Has reducido tus gastos en Ocio un 15% respecto al mes pasado",
                "data": {
                    "thisMonth": expenses_this_month_total,
                    "lastMonth": expenses_last_month_total,
                    "reduction": round(expense_reduction)
                },
                "relevance": 75,
                "created_at": datetime.now().isoformat()
            }
        ]
        
        if meditation_habit.data and streak > 0:
            insights.append({
                "id": "3",
                "user_id": user_id,
                "insight_type": "habits",
                "description": f"Has mantenido tu hábito de \"Meditación\" durante {streak} días consecutivos",
                "data": {
                    "streak": streak,
                    "habitName": "Meditación"
                },
                "relevance": 85,
                "created_at": datetime.now().isoformat()
            })
        
        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
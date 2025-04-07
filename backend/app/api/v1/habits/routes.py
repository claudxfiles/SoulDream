from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.core.auth import get_current_user
from app.db.database import get_supabase_client

router = APIRouter()

@router.get("/analytics")
async def get_habits_analytics(current_user: dict = Depends(get_current_user)):
    """
    Obtiene los datos de análisis de hábitos del usuario:
    - Rachas actuales y mejores rachas
    - Tasa de completado diario
    - Datos para el mapa de calor
    """
    try:
        supabase = get_supabase_client()
        user_id = current_user.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Usuario no autenticado")

        # 1. Obtener hábitos del usuario
        habits_response = await supabase.table('habits')\
            .select('id, title, current_streak, best_streak')\
            .eq('user_id', user_id)\
            .execute()

        if habits_response.error:
            raise HTTPException(status_code=500, detail=str(habits_response.error))

        habits = habits_response.data

        # 2. Obtener registros de los últimos 365 días
        year_ago = datetime.now() - timedelta(days=365)
        logs_response = await supabase.table('habit_logs')\
            .select('habit_id, completed_date')\
            .gte('completed_date', year_ago.date().isoformat())\
            .in_('habit_id', [h['id'] for h in habits])\
            .execute()

        if logs_response.error:
            raise HTTPException(status_code=500, detail=str(logs_response.error))

        logs = logs_response.data

        # Procesar datos para las gráficas
        habit_streaks = []
        daily_completions = {}
        completion_heatmap = {}

        # Inicializar datos diarios
        for i in range(30):
            date = datetime.now() - timedelta(days=i)
            date_str = date.date().isoformat()
            daily_completions[date_str] = {
                'date': date_str,
                'completed_count': 0,
                'total_count': len(habits),
                'completion_rate': 0
            }

        # Inicializar mapa de calor
        for i in range(365):
            date = datetime.now() - timedelta(days=i)
            date_str = date.date().isoformat()
            completion_heatmap[date_str] = 0

        # Procesar logs
        for log in logs:
            date_str = log['completed_date']
            
            # Actualizar completados diarios si está en los últimos 30 días
            if date_str in daily_completions:
                daily_completions[date_str]['completed_count'] += 1
                daily_completions[date_str]['completion_rate'] = (
                    daily_completions[date_str]['completed_count'] / 
                    daily_completions[date_str]['total_count']
                ) * 100

            # Actualizar mapa de calor
            if date_str in completion_heatmap:
                completion_heatmap[date_str] += 1

        # Preparar datos de rachas
        for habit in habits:
            habit_streaks.append({
                'habit_name': habit['title'],
                'current_streak': habit['current_streak'],
                'best_streak': habit['best_streak'],
                'completion_rate': calculate_completion_rate(habit['id'], logs)
            })

        return {
            'habit_streaks': habit_streaks,
            'daily_completions': list(daily_completions.values()),
            'completion_heatmap': [
                {'date': date, 'value': value}
                for date, value in completion_heatmap.items()
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_completion_rate(habit_id: str, logs: List[Dict[str, Any]]) -> float:
    """Calcula la tasa de completado de un hábito en los últimos 30 días"""
    thirty_days_ago = datetime.now() - timedelta(days=30)
    completed_days = sum(
        1 for log in logs
        if log['habit_id'] == habit_id and 
        datetime.fromisoformat(log['completed_date']) >= thirty_days_ago
    )
    return (completed_days / 30) * 100 
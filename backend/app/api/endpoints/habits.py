from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Optional
from datetime import datetime, date, timedelta
import uuid
import logging
from functools import lru_cache

from app.services.auth import get_current_user
from app.schemas.user import User
# Verificar qué imports se están usando
# Comentaré el import original para ver cuál es
from app.schemas.habits import Habit, HabitCreate, HabitUpdate, HabitLog, HabitLogCreate
# from app.schemas.habit import Habit, HabitCreate, HabitUpdate, HabitLog, HabitLogCreate
from app.db.database import get_supabase_client
from app.core.config import settings
from supabase import create_client

router = APIRouter()

# Crear una función con caché para el cliente con rol de servicio
@lru_cache(maxsize=1)
def get_service_client():
    """Obtiene un cliente Supabase con rol de servicio (con caché)"""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.get("/analytics", response_model=dict)
async def get_habits_analytics(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene analíticas de los hábitos del usuario
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Obteniendo analíticas para el usuario: {current_user.id}")
    
    try:
        supabase_service = get_service_client()
        
        # Obtener todos los hábitos activos del usuario
        habits_response = supabase_service.table("habits") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .eq("is_active", True) \
            .execute()
            
        habits = habits_response.data
        
        # Obtener los logs de los últimos 30 días para todos los hábitos
        today = datetime.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        habit_streaks = []
        daily_completions = []
        completion_heatmap = []
        
        for habit in habits:
            # Obtener logs del hábito
            logs_response = supabase_service.table("habit_logs") \
                .select("*") \
                .eq("habit_id", habit["id"]) \
                .gte("completed_date", thirty_days_ago.isoformat()) \
                .order("completed_date") \
                .execute()
                
            logs = logs_response.data
            
            # Calcular racha actual y mejor racha
            current_streak = habit.get("current_streak", 0)
            best_streak = habit.get("best_streak", 0)
            
            # Calcular tasa de completado
            total_days = (today - thirty_days_ago).days
            completed_days = len(logs)
            completion_rate = (completed_days / total_days) * 100 if total_days > 0 else 0
            
            habit_streaks.append({
                "habit_name": habit["title"],
                "current_streak": current_streak,
                "best_streak": best_streak,
                "completion_rate": round(completion_rate, 2)
            })
            
            # Agregar datos para el heatmap
            for log in logs:
                completion_heatmap.append({
                    "date": log["completed_date"],
                    "value": 1
                })
            
            # Calcular completados por día
            daily_counts = {}
            for log in logs:
                date = log["completed_date"]
                if date not in daily_counts:
                    daily_counts[date] = {
                        "completed_count": 0,
                        "total_count": len(habits)
                    }
                daily_counts[date]["completed_count"] += 1
            
            # Convertir daily_counts a lista
            for date, counts in daily_counts.items():
                daily_completions.append({
                    "date": date,
                    "completed_count": counts["completed_count"],
                    "total_count": counts["total_count"],
                    "completion_rate": (counts["completed_count"] / counts["total_count"]) * 100
                })
        
        return {
            "habit_streaks": habit_streaks,
            "daily_completions": sorted(daily_completions, key=lambda x: x["date"]),
            "completion_heatmap": sorted(completion_heatmap, key=lambda x: x["date"])
        }
        
    except Exception as e:
        logger.error(f"Error al obtener analíticas de hábitos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener analíticas de hábitos: {str(e)}"
        )

@router.get("/", response_model=List[Habit])
async def read_habits(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene todos los hábitos del usuario actual
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Obteniendo hábitos para el usuario: {current_user.id}")
    
    try:
        # Usar directamente el cliente con rol de servicio para evitar consultas redundantes
        supabase_service = get_service_client()
        
        # Intentar primero con is_active
        try:
            response = supabase_service.table("habits") \
                .select("*") \
                .eq("user_id", current_user.id) \
                .eq("is_active", True) \
                .execute()
        except Exception as e:
            # Si falla, probablemente is_active no existe, intentar sin el filtro
            if "42703" in str(e):  # Código de error PostgreSQL para columna no existente
                response = supabase_service.table("habits") \
                    .select("*") \
                    .eq("user_id", current_user.id) \
                    .execute()
            else:
                raise e
        
        logger.info(f"Hábitos encontrados: {len(response.data)}")
        return [Habit(**habit) for habit in response.data]
    except Exception as e:
        logger.error(f"Error al obtener hábitos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener hábitos: {str(e)}"
        )

@router.post("/", response_model=Habit)
async def create_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea un nuevo hábito
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Creando hábito para usuario: {current_user.id}")
    
    try:
        # Preparar datos con valores por defecto
        habit_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Convertir a diccionario y eliminar campos que podrían no existir
        habit_dict = habit_in.dict()
        
        # Campos requeridos que siempre deben existir
        required_fields = {
            "id": habit_id,
            "user_id": current_user.id,
            "title": habit_dict["title"],
            "created_at": now,
            "updated_at": now
        }
        
        # Campos opcionales que podrían no existir en la base de datos
        optional_fields = {
            "description": habit_dict.get("description"),
            "frequency": habit_dict.get("frequency", "daily"),
            "specific_days": habit_dict.get("specific_days"),
            "category": habit_dict.get("category"),
            "reminder_time": habit_dict.get("reminder_time"),
            "cue": habit_dict.get("cue"),
            "reward": habit_dict.get("reward"),
            "goal_value": habit_dict.get("goal_value", 1),
            "is_active": True,
            "current_streak": 0,
            "best_streak": 0,
            "total_completions": 0,
            "related_goal_id": habit_dict.get("related_goal_id")
        }
        
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        # Intentar insertar primero solo con campos requeridos
        try:
            response = supabase_service.table("habits").insert(required_fields).execute()
            habit_id = response.data[0]["id"]
            
            # Si la inserción básica fue exitosa, intentar actualizar con campos opcionales
            # uno por uno para identificar cuáles existen
            for field, value in optional_fields.items():
                if value is not None:
                    try:
                        update_data = {field: value}
                        supabase_service.table("habits") \
                            .update(update_data) \
                            .eq("id", habit_id) \
                            .execute()
                    except Exception as field_error:
                        logger.warning(f"Campo {field} no pudo ser actualizado: {str(field_error)}")
                        continue
            
            # Obtener el hábito actualizado
            final_response = supabase_service.table("habits") \
                .select("*") \
                .eq("id", habit_id) \
                .execute()
            
            if not final_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al obtener el hábito creado"
                )
            
            return Habit(**final_response.data[0])
            
        except Exception as e:
            logger.error(f"Error al crear el hábito: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al crear el hábito: {str(e)}"
            )
            
    except Exception as e:
        logger.error(f"Error al crear el hábito: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el hábito: {str(e)}"
        )

@router.get("/{habit_id}", response_model=Habit)
async def read_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene un hábito específico por ID
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        response = supabase_service.table("habits") \
            .select("*") \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .eq("is_active", True) \
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hábito no encontrado"
            )
        
        return Habit(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener el hábito {habit_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener el hábito: {str(e)}"
        )

@router.put("/{habit_id}", response_model=Habit)
async def update_habit(
    habit_id: str,
    habit_in: HabitUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Actualiza un hábito específico
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        # Verificar que el hábito existe y pertenece al usuario
        get_response = supabase_service.table("habits") \
            .select("*") \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .eq("is_active", True) \
            .execute()
        
        if not get_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hábito no encontrado"
            )
        
        # Actualizar el hábito
        habit_data = habit_in.dict(exclude_unset=True)
        habit_data["updated_at"] = datetime.utcnow().isoformat()
        
        update_response = supabase_service.table("habits") \
            .update(habit_data) \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el hábito"
            )
        
        return Habit(**update_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al actualizar el hábito {habit_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar el hábito: {str(e)}"
        )

@router.delete("/{habit_id}", response_model=Habit)
async def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Elimina (soft delete) un hábito específico
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Solicitud para eliminar hábito {habit_id} del usuario {current_user.id}")
    
    try:
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        # Verificar que el hábito existe y pertenece al usuario
        get_response = supabase_service.table("habits") \
            .select("*") \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .eq("is_active", True) \
            .execute()
        
        if not get_response.data:
            logger.error(f"Hábito {habit_id} no encontrado para el usuario {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hábito no encontrado"
            )
        
        # Realizar una eliminación física directa
        delete_response = supabase_service.table("habits") \
            .delete() \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        logger.info(f"Hábito {habit_id} eliminado correctamente")
        
        # Devolver el hábito eliminado
        return Habit(**get_response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al eliminar hábito {habit_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar el hábito: {str(e)}"
        )

# Endpoints para registros de hábitos
@router.get("/{habit_id}/logs", response_model=List[HabitLog])
@router.get("/{habit_id}/logs/", response_model=List[HabitLog])
async def read_habit_logs(
    habit_id: str,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene los registros de un hábito específico, con filtros opcionales por fecha
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Obteniendo logs para el hábito: {habit_id} del usuario: {current_user.id}")
    
    try:
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        # Verificar que el hábito existe y pertenece al usuario
        habit_response = supabase_service.table("habits") \
            .select("id") \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .eq("is_active", True) \
            .execute()
        
        logger.info(f"Respuesta al verificar hábito: {habit_response.data}")
        
        if not habit_response.data:
            logger.warning(f"Hábito no encontrado o no pertenece al usuario: {habit_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hábito no encontrado"
            )
        
        # Consultar los logs
        query = supabase_service.table("habit_logs") \
            .select("*") \
            .eq("habit_id", habit_id)
        
        # Aplicar filtros de fecha si se proporcionan
        if from_date:
            query = query.gte("completed_date", from_date.isoformat())
        
        if to_date:
            query = query.lte("completed_date", to_date.isoformat())
        
        response = query.order("completed_date", desc=True).execute()
        
        logger.info(f"Logs obtenidos: {len(response.data)}")
        
        return [HabitLog(**log) for log in response.data]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al obtener logs del hábito: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener registros del hábito: {str(e)}"
        )

@router.post("/{habit_id}/logs", response_model=HabitLog)
@router.post("/{habit_id}/logs/", response_model=HabitLog)
async def create_habit_log(
    habit_id: str,
    log_in: HabitLogCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea un nuevo registro para un hábito específico
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Creando log para el hábito: {habit_id} del usuario: {current_user.id}")
    
    try:
        # Usar el cliente con rol de servicio
        supabase_service = get_service_client()
        
        # Verificar primero que el hábito existe y pertenece al usuario
        habit_response = supabase_service.table("habits") \
            .select("id") \
            .eq("id", habit_id) \
            .eq("user_id", current_user.id) \
            .execute()
        
        if not habit_response.data:
            logger.warning(f"Hábito no encontrado o no pertenece al usuario: {habit_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hábito no encontrado o no pertenece al usuario"
            )
        
        # Crear el log del hábito
        log_data = log_in.dict()
        log_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Si no se proporciona una fecha, usar la fecha actual
        if not log_data.get("completed_date"):
            log_data["completed_date"] = date.today().isoformat()
        
        log_db = {
            **log_data,
            "id": log_id,
            "habit_id": habit_id,
            "user_id": current_user.id,
            "created_at": now
        }
        
        # Insertar el log
        response = supabase_service.table("habit_logs").insert(log_db).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el registro del hábito: No se recibieron datos"
            )
        
        return HabitLog(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al crear log del hábito: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el registro del hábito: {str(e)}"
        )

@router.get("/diagnostic", response_model=dict)
async def diagnostic_habits(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Endpoint de diagnóstico para verificar problemas con los hábitos
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Usar rol de servicio para consultar directamente
        supabase_service = get_service_client()
        
        # Consultar hábitos con rol de servicio (bypass RLS)
        service_response = supabase_service.table("habits") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .execute()
        
        # Consultar con cliente normal
        supabase = get_supabase_client()
        normal_response = supabase.table("habits") \
            .select("*") \
            .eq("user_id", current_user.id) \
            .execute()
        
        return {
            "user_id": current_user.id,
            "habits_with_service_role": len(service_response.data),
            "habits_detail_service_role": service_response.data,
            "habits_with_normal_client": len(normal_response.data),
            "habits_detail_normal_client": normal_response.data,
            "auth_status": "authenticated" if current_user else "not authenticated"
        }
    except Exception as e:
        logger.error(f"Error en diagnóstico: {str(e)}")
        
        return {
            "error": str(e),
            "user_id": current_user.id if current_user else None,
            "auth_status": "authenticated" if current_user else "not authenticated"
        }

@router.post("/setup", response_model=dict)
async def setup_habits_table(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Endpoint de configuración para crear/verificar la tabla habits
    """
    logger = logging.getLogger(__name__)
    logger.info("Iniciando configuración de la tabla habits")
    
    try:
        # Usar rol de servicio para ejecutar SQL directamente
        supabase_service = get_service_client()
        
        # Leer el archivo SQL
        with open("supabase/migrations/20240326_create_habits_table.sql", "r") as f:
            sql = f.read()
        
        # Ejecutar el SQL
        response = supabase_service.table("habits").execute(sql)
        
        # Verificar que la tabla existe consultando un registro
        test_response = supabase_service.table("habits").select("*").limit(1).execute()
        
        return {
            "status": "success",
            "message": "Tabla habits creada/verificada correctamente",
            "table_exists": True,
            "sample_data": test_response.data if test_response.data else []
        }
    except Exception as e:
        logger.error(f"Error en configuración de habits: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "table_exists": False,
            "sample_data": []
        }

@router.get("/logs/today", response_model=List[dict])
async def get_today_habits_logs(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Obtiene los logs de hoy para todos los hábitos del usuario en una sola consulta
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Obteniendo logs de hoy para el usuario: {current_user.id}")
    
    try:
        supabase_service = get_service_client()
        today = date.today().isoformat()
        
        # Obtener todos los logs de hoy en una sola consulta
        response = supabase_service.table("habit_logs") \
            .select("habit_id, completed_date") \
            .eq("completed_date", today) \
            .execute()
            
        # Crear un mapa de hábitos completados
        completed_habits = {
            log["habit_id"]: True 
            for log in response.data
        }
        
        return [{"habit_id": habit_id, "completed": True} for habit_id in completed_habits]
        
    except Exception as e:
        logger.error(f"Error al obtener logs de hábitos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener logs de hábitos: {str(e)}"
        ) 
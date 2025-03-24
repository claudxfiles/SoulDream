from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.core.dependencies import get_current_user, get_supabase_client
from app.schemas.calendar import (
    CalendarEventCreate, 
    CalendarEventUpdate,
    CalendarEventResponse,
    CalendarSyncRequest,
    CalendarSyncResponse,
    GoogleCredentials
)
from app.services.calendar import GoogleCalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.post("/sync", response_model=CalendarSyncResponse)
async def sync_calendar(
    request: CalendarSyncRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Sincroniza eventos entre Google Calendar y la base de datos local.
    
    - direction: "pull" (de Google a local), "push" (de local a Google) o "bidirectional" (ambos)
    - sync_type: "manual" (iniciado por usuario) o "auto" (automático)
    """
    try:
        # Obtener las credenciales de Google Calendar del usuario
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        # Verificar si el usuario tiene credenciales
        if not await calendar_service.has_valid_credentials():
            raise HTTPException(status_code=401, detail="No hay credenciales válidas de Google Calendar")
            
        # Iniciar sincronización en segundo plano
        if request.background:
            # Crear registro de sincronización
            sync_log_id = await calendar_service.create_sync_log(request.sync_type)
            
            # Añadir tarea de sincronización en segundo plano
            background_tasks.add_task(
                calendar_service.sync_calendar,
                sync_log_id,
                request.start_date,
                request.end_date,
                request.direction,
                request.sync_type
            )
            
            return {
                "success": True,
                "message": "Sincronización iniciada en segundo plano",
                "sync_log_id": sync_log_id
            }
        else:
            # Sincronización síncrona
            sync_result = await calendar_service.sync_calendar(
                None,  # No hay ID de log previo
                request.start_date,
                request.end_date,
                request.direction,
                request.sync_type
            )
            
            return {
                "success": sync_result["success"],
                "message": "Sincronización completada",
                "events_created": sync_result["events_created"],
                "events_updated": sync_result["events_updated"],
                "events_deleted": sync_result["events_deleted"],
                "errors": sync_result["errors"]
            }
    except Exception as e:
        # Capturar cualquier excepción y devolver un error amigable
        raise HTTPException(
            status_code=500,
            detail=f"Error en la sincronización: {str(e)}"
        )

@router.get("/events", response_model=List[CalendarEventResponse])
async def get_calendar_events(
    start_date: datetime,
    end_date: datetime,
    include_google_events: bool = True,
    include_local_events: bool = True,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Obtiene eventos de calendario para un rango de fechas específico.
    Puede incluir eventos de Google Calendar, eventos locales o ambos.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        events = await calendar_service.get_events(
            start_date,
            end_date,
            include_google_events,
            include_local_events
        )
        
        return events
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo eventos: {str(e)}"
        )

@router.post("/events", response_model=CalendarEventResponse)
async def create_calendar_event(
    event: CalendarEventCreate,
    sync_with_google: bool = True,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Crea un nuevo evento de calendario.
    Opcionalmente sincroniza con Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        created_event = await calendar_service.create_event(event, sync_with_google)
        
        return created_event
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creando evento: {str(e)}"
        )

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: str,
    event: CalendarEventUpdate,
    sync_with_google: bool = True,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Actualiza un evento de calendario existente.
    Opcionalmente sincroniza con Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        updated_event = await calendar_service.update_event(event_id, event, sync_with_google)
        
        return updated_event
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error actualizando evento: {str(e)}"
        )

@router.delete("/events/{event_id}", response_model=Dict[str, Any])
async def delete_calendar_event(
    event_id: str,
    sync_with_google: bool = True,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Elimina un evento de calendario.
    Opcionalmente elimina también en Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        result = await calendar_service.delete_event(event_id, sync_with_google)
        
        return {"success": result, "message": "Evento eliminado con éxito"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando evento: {str(e)}"
        )

@router.get("/sync/status/{sync_log_id}", response_model=Dict[str, Any])
async def get_sync_status(
    sync_log_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Obtiene el estado de una sincronización en segundo plano.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        status = await calendar_service.get_sync_log(sync_log_id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Registro de sincronización no encontrado")
            
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo estado de sincronización: {str(e)}"
        )

@router.get("/connection/status", response_model=Dict[str, Any])
async def check_google_connection(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Verifica el estado de conexión con Google Calendar.
    """
    try:
        calendar_service = GoogleCalendarService(supabase, current_user["id"])
        
        status = await calendar_service.check_connection_status()
        
        return status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verificando conexión: {str(e)}"
        ) 
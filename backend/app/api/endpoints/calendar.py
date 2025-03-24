from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from uuid import UUID
import json

from app.api.deps import get_current_active_user, get_db
from app.models.users import User
from app.models.calendar import CalendarEvent
from app.schemas.calendar import (
    CalendarEventCreate, 
    CalendarEventUpdate, 
    CalendarEventResponse,
    CalendarSyncRequest,
    CalendarSyncResponse,
    GoogleCredentials
)
from app.services.calendar.google_calendar import GoogleCalendarService
from app.services.calendar.sync_service import CalendarSyncService
from app.core.config import settings

router = APIRouter()

@router.get("/events", response_model=List[CalendarEventResponse])
async def get_calendar_events(
    start_date: datetime = Query(..., description="Fecha de inicio para filtrar eventos"),
    end_date: datetime = Query(..., description="Fecha de fin para filtrar eventos"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene los eventos de calendario del usuario actual dentro del rango de fechas especificado.
    """
    stmt = select(CalendarEvent).where(
        CalendarEvent.user_id == current_user.id,
        CalendarEvent.end_time >= start_date,
        CalendarEvent.start_time <= end_date
    ).order_by(CalendarEvent.start_time)
    
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    return events

@router.post("/events", response_model=CalendarEventResponse)
async def create_calendar_event(
    event: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crea un nuevo evento de calendario para el usuario actual.
    """
    db_event = CalendarEvent(
        user_id=current_user.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        location=event.location,
        is_all_day=event.is_all_day,
        color=event.color,
        recurrence_rule=event.recurrence_rule,
        is_recurring=bool(event.recurrence_rule),
        related_id=event.related_id,
        related_type=event.related_type,
        sync_status="local"
    )
    
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    
    return db_event

@router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_calendar_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtiene un evento de calendario específico por su ID.
    """
    stmt = select(CalendarEvent).where(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    )
    
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    return event

@router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    event_id: UUID,
    event_update: CalendarEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Actualiza un evento de calendario existente.
    """
    stmt = select(CalendarEvent).where(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    )
    
    result = await db.execute(stmt)
    db_event = result.scalar_one_or_none()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Actualizar campos si están presentes en la solicitud
    update_data = event_update.dict(exclude_unset=True)
    
    # Si el evento ya estaba sincronizado con Google, marcarlo como modificado
    if db_event.sync_status == "synced" and update_data:
        update_data["sync_status"] = "modified"
        
    # Actualizar is_recurring si se modifica recurrence_rule
    if "recurrence_rule" in update_data:
        update_data["is_recurring"] = bool(update_data["recurrence_rule"])
    
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    await db.commit()
    await db.refresh(db_event)
    
    return db_event

@router.delete("/events/{event_id}", status_code=204)
async def delete_calendar_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Elimina un evento de calendario existente.
    """
    stmt = select(CalendarEvent).where(
        CalendarEvent.id == event_id,
        CalendarEvent.user_id == current_user.id
    )
    
    result = await db.execute(stmt)
    db_event = result.scalar_one_or_none()
    
    if not db_event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Si el evento está sincronizado con Google y tiene un ID de Google,
    # se podría eliminar también de Google aquí o marcarlo para eliminación en la próxima sincronización
    
    await db.delete(db_event)
    await db.commit()
    
    return None

@router.post("/sync", response_model=CalendarSyncResponse)
async def sync_calendar(
    sync_request: CalendarSyncRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Sincroniza eventos de calendario entre la aplicación local y Google Calendar.
    """
    # Verificar si el usuario tiene credenciales de Google Calendar guardadas
    if not current_user.google_credentials:
        raise HTTPException(
            status_code=400, 
            detail="No hay credenciales de Google Calendar disponibles. Por favor, conecte su cuenta."
        )
    
    try:
        # Inicializar el servicio de Google Calendar con las credenciales del usuario
        google_service = GoogleCalendarService(current_user.google_credentials)
        
        # Inicializar el servicio de sincronización
        sync_service = CalendarSyncService(db, google_service, current_user.id)
        
        # Si la solicitud es para sincronización en segundo plano
        if sync_request.background:
            background_tasks.add_task(
                sync_service.sync_events,
                sync_request.start_date,
                sync_request.end_date,
                sync_request.direction
            )
            
            return CalendarSyncResponse(
                success=True,
                message="Sincronización iniciada en segundo plano"
            )
        else:
            # Sincronización síncrona
            result = await sync_service.sync_events(
                sync_request.start_date,
                sync_request.end_date,
                sync_request.direction
            )
            
            return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la sincronización: {str(e)}"
        )

@router.post("/connect/google", status_code=200)
async def connect_google_calendar(
    credentials: GoogleCredentials,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Conecta la cuenta de Google Calendar del usuario guardando sus credenciales.
    """
    try:
        # Validar las credenciales intentando inicializar el servicio
        GoogleCalendarService(json.dumps(credentials.dict()))
        
        # Guardar las credenciales en el perfil del usuario
        current_user.google_credentials = json.dumps(credentials.dict())
        db.add(current_user)
        await db.commit()
        
        return {"message": "Cuenta de Google Calendar conectada correctamente"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error al conectar la cuenta de Google Calendar: {str(e)}"
        )

@router.delete("/connect/google", status_code=200)
async def disconnect_google_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Desconecta la cuenta de Google Calendar del usuario eliminando sus credenciales.
    """
    if not current_user.google_credentials:
        raise HTTPException(
            status_code=400,
            detail="No hay una cuenta de Google Calendar conectada"
        )
    
    current_user.google_credentials = None
    db.add(current_user)
    await db.commit()
    
    return {"message": "Cuenta de Google Calendar desconectada correctamente"} 
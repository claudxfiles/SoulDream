import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete

from app.models.calendar import CalendarEvent
from app.services.calendar.google_calendar import GoogleCalendarService
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarSyncResponse

logger = logging.getLogger(__name__)

class CalendarSyncService:
    """Servicio para sincronizar eventos entre la base de datos local y Google Calendar."""
    
    def __init__(self, db_session: AsyncSession, google_service: GoogleCalendarService, user_id: UUID):
        """
        Inicializa el servicio de sincronización.
        
        Args:
            db_session: Sesión de base de datos async
            google_service: Instancia del servicio de Google Calendar
            user_id: ID del usuario actual
        """
        self.db = db_session
        self.google_service = google_service
        self.user_id = user_id
    
    async def sync_events(self, start_date: datetime, end_date: datetime, 
                          direction: str = "bidirectional") -> CalendarSyncResponse:
        """
        Sincroniza eventos entre la base de datos local y Google Calendar.
        
        Args:
            start_date: Fecha de inicio para la sincronización
            end_date: Fecha de fin para la sincronización
            direction: Dirección de sincronización (pull, push, bidirectional)
            
        Returns:
            Resumen de la sincronización
        """
        try:
            events_created = 0
            events_updated = 0
            events_deleted = 0
            errors = []
            
            if direction in ["pull", "bidirectional"]:
                pull_stats = await self._pull_from_google(start_date, end_date)
                events_created += pull_stats[0]
                events_updated += pull_stats[1]
                if pull_stats[2]:
                    errors.extend(pull_stats[2])
            
            if direction in ["push", "bidirectional"]:
                push_stats = await self._push_to_google(start_date, end_date)
                events_created += push_stats[0]
                events_updated += push_stats[1]
                if push_stats[2]:
                    errors.extend(push_stats[2])
            
            # Actualizar el timestamp de la última sincronización
            await self._update_sync_timestamp(start_date, end_date)
            
            return CalendarSyncResponse(
                success=True,
                message="Sincronización completada",
                events_created=events_created,
                events_updated=events_updated,
                events_deleted=events_deleted,
                errors=errors if errors else None
            )
        except Exception as e:
            logger.error(f"Error en la sincronización de calendario: {str(e)}")
            return CalendarSyncResponse(
                success=False,
                message=f"Error en la sincronización: {str(e)}",
                errors=[str(e)]
            )
    
    async def _pull_from_google(self, start_date: datetime, end_date: datetime) -> Tuple[int, int, List[str]]:
        """
        Obtiene eventos de Google Calendar y los guarda en la base de datos local.
        
        Args:
            start_date: Fecha de inicio para los eventos
            end_date: Fecha de fin para los eventos
            
        Returns:
            Tuple con (eventos_creados, eventos_actualizados, errores)
        """
        events_created = 0
        events_updated = 0
        errors = []
        
        try:
            # Obtener eventos de Google Calendar
            google_events = self.google_service.get_events(start_date, end_date)
            
            # Obtener IDs de eventos de Google que ya existen en nuestra base de datos
            stmt = select(CalendarEvent.google_event_id).where(
                CalendarEvent.user_id == self.user_id,
                CalendarEvent.google_event_id.isnot(None)
            )
            result = await self.db.execute(stmt)
            existing_google_ids = {row[0] for row in result.fetchall()}
            
            for google_event in google_events:
                try:
                    google_id = google_event.get('id')
                    
                    # Verificar si el evento ya existe en nuestra base de datos
                    if google_id in existing_google_ids:
                        # Actualizar evento existente
                        await self._update_local_event_from_google(google_event)
                        events_updated += 1
                    else:
                        # Crear nuevo evento
                        await self._create_local_event_from_google(google_event)
                        events_created += 1
                except Exception as e:
                    error_msg = f"Error procesando evento de Google {google_event.get('id', 'desconocido')}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    
            return events_created, events_updated, errors
        except Exception as e:
            error_msg = f"Error obteniendo eventos de Google Calendar: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            return events_created, events_updated, errors
    
    async def _push_to_google(self, start_date: datetime, end_date: datetime) -> Tuple[int, int, List[str]]:
        """
        Envía eventos locales a Google Calendar.
        
        Args:
            start_date: Fecha de inicio para los eventos
            end_date: Fecha de fin para los eventos
            
        Returns:
            Tuple con (eventos_creados, eventos_actualizados, errores)
        """
        events_created = 0
        events_updated = 0
        errors = []
        
        try:
            # Obtener eventos locales que deben sincronizarse con Google
            stmt = select(CalendarEvent).where(
                CalendarEvent.user_id == self.user_id,
                CalendarEvent.start_time >= start_date,
                CalendarEvent.end_time <= end_date,
                CalendarEvent.sync_status.in_(["local", "modified"])
            )
            result = await self.db.execute(stmt)
            local_events = result.scalars().all()
            
            for event in local_events:
                try:
                    # Si el evento ya tiene un ID de Google, actualizar
                    if event.google_event_id:
                        google_event = self._convert_local_to_google_event(event)
                        result = self.google_service.update_event(event.google_event_id, google_event)
                        
                        # Actualizar estado local
                        event.sync_status = "synced"
                        event.last_synced_at = datetime.utcnow()
                        self.db.add(event)
                        await self.db.commit()
                        
                        events_updated += 1
                    else:
                        # Si no tiene ID de Google, crear nuevo
                        google_event = self._convert_local_to_google_event(event)
                        result = self.google_service.create_event(google_event)
                        
                        # Actualizar el evento local con el ID de Google
                        event.google_event_id = result.get('id')
                        event.sync_status = "synced"
                        event.last_synced_at = datetime.utcnow()
                        self.db.add(event)
                        await self.db.commit()
                        
                        events_created += 1
                except Exception as e:
                    error_msg = f"Error sincronizando evento local {event.id} con Google: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            return events_created, events_updated, errors
        except Exception as e:
            error_msg = f"Error enviando eventos a Google Calendar: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            return events_created, events_updated, errors
    
    async def _update_local_event_from_google(self, google_event: Dict[str, Any]) -> CalendarEvent:
        """
        Actualiza un evento local con datos de Google Calendar.
        
        Args:
            google_event: Evento de Google Calendar
            
        Returns:
            Evento local actualizado
        """
        # Buscar el evento local por el ID de Google
        stmt = select(CalendarEvent).where(
            CalendarEvent.user_id == self.user_id,
            CalendarEvent.google_event_id == google_event.get('id')
        )
        result = await self.db.execute(stmt)
        local_event = result.scalar_one_or_none()
        
        if local_event:
            # Convertir el evento de Google a formato local
            start_time, end_time, is_all_day = self._parse_google_datetime(google_event)
            
            # Actualizar campos
            local_event.title = google_event.get('summary', '')
            local_event.description = google_event.get('description', '')
            local_event.start_time = start_time
            local_event.end_time = end_time
            local_event.is_all_day = is_all_day
            local_event.location = google_event.get('location', '')
            local_event.color = self._map_google_color_id(google_event.get('colorId'))
            
            # Si hay reglas de recurrencia
            if 'recurrence' in google_event:
                recurrence = google_event['recurrence'][0] if google_event['recurrence'] else None
                if recurrence and recurrence.startswith('RRULE:'):
                    local_event.recurrence_rule = recurrence[6:]  # Quitar el prefijo 'RRULE:'
                    local_event.is_recurring = True
            
            local_event.sync_status = "synced"
            local_event.last_synced_at = datetime.utcnow()
            
            # Guardar cambios
            self.db.add(local_event)
            await self.db.commit()
            await self.db.refresh(local_event)
            
            return local_event
        else:
            logger.warning(f"No se encontró evento local para Google ID: {google_event.get('id')}")
            return None
    
    async def _create_local_event_from_google(self, google_event: Dict[str, Any]) -> CalendarEvent:
        """
        Crea un nuevo evento local a partir de un evento de Google Calendar.
        
        Args:
            google_event: Evento de Google Calendar
            
        Returns:
            Nuevo evento local creado
        """
        # Convertir el evento de Google a formato local
        start_time, end_time, is_all_day = self._parse_google_datetime(google_event)
        
        # Preparar recurrencia
        recurrence_rule = None
        is_recurring = False
        if 'recurrence' in google_event and google_event['recurrence']:
            recurrence = google_event['recurrence'][0]
            if recurrence.startswith('RRULE:'):
                recurrence_rule = recurrence[6:]  # Quitar el prefijo 'RRULE:'
                is_recurring = True
        
        # Crear nuevo evento
        new_event = CalendarEvent(
            user_id=self.user_id,
            title=google_event.get('summary', ''),
            description=google_event.get('description', ''),
            start_time=start_time,
            end_time=end_time,
            is_all_day=is_all_day,
            location=google_event.get('location', ''),
            color=self._map_google_color_id(google_event.get('colorId')),
            google_event_id=google_event.get('id'),
            sync_status="synced",
            last_synced_at=datetime.utcnow(),
            recurrence_rule=recurrence_rule,
            is_recurring=is_recurring
        )
        
        # Guardar en base de datos
        self.db.add(new_event)
        await self.db.commit()
        await self.db.refresh(new_event)
        
        return new_event
    
    def _convert_local_to_google_event(self, local_event: CalendarEvent) -> CalendarEventUpdate:
        """
        Convierte un evento local a formato para Google Calendar.
        
        Args:
            local_event: Evento de la base de datos local
            
        Returns:
            Evento en formato para Google Calendar
        """
        event = CalendarEventUpdate(
            title=local_event.title,
            description=local_event.description,
            start_time=local_event.start_time,
            end_time=local_event.end_time,
            is_all_day=local_event.is_all_day,
            location=local_event.location,
            color=local_event.color,
            recurrence_rule=local_event.recurrence_rule
        )
        
        return event
    
    def _parse_google_datetime(self, google_event: Dict[str, Any]) -> Tuple[datetime, datetime, bool]:
        """
        Extrae y formatea las fechas de un evento de Google.
        
        Args:
            google_event: Evento de Google Calendar
            
        Returns:
            Tuple (start_time, end_time, is_all_day)
        """
        start_info = google_event.get('start', {})
        end_info = google_event.get('end', {})
        
        # Determinar si es un evento de todo el día
        is_all_day = 'date' in start_info and 'date' in end_info
        
        if is_all_day:
            # Para eventos de todo el día, Google usa 'date'
            start_str = start_info.get('date')
            end_str = end_info.get('date')
            
            # Convertir a datetime (el fin es exclusivo en Google, así que restamos 1 día)
            start_time = datetime.fromisoformat(start_str)
            end_time = datetime.fromisoformat(end_str) - timedelta(days=1)
            
            # Establecer a final del día para mantener consistencia
            end_time = end_time.replace(hour=23, minute=59, second=59)
        else:
            # Para eventos con hora, Google usa 'dateTime'
            start_str = start_info.get('dateTime')
            end_str = end_info.get('dateTime')
            
            # Convertir a datetime
            start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
        
        return start_time, end_time, is_all_day
    
    def _map_google_color_id(self, color_id: Optional[str]) -> Optional[str]:
        """
        Mapea un ID de color de Google Calendar a un color en nuestro sistema.
        
        Args:
            color_id: ID de color de Google
            
        Returns:
            Color en formato que usamos en nuestra aplicación
        """
        if not color_id:
            return None
            
        # Mapeo de IDs de Google a colores
        color_mapping = {
            '1': 'blue',
            '2': 'green',
            '3': 'purple',
            '4': 'red',
            '5': 'yellow',
            '6': 'orange',
            '7': 'turquoise',
            '8': 'gray',
            '9': 'bold blue',
            '10': 'bold green',
            '11': 'bold red'
        }
        
        return color_mapping.get(color_id, 'blue')
    
    async def _update_sync_timestamp(self, start_date: datetime, end_date: datetime) -> None:
        """
        Actualiza el timestamp de última sincronización para los eventos.
        
        Args:
            start_date: Fecha de inicio para los eventos
            end_date: Fecha de fin para los eventos
        """
        now = datetime.utcnow()
        
        # Actualizar todos los eventos en el rango que tengan estado synced
        stmt = update(CalendarEvent).where(
            CalendarEvent.user_id == self.user_id,
            CalendarEvent.start_time >= start_date,
            CalendarEvent.end_time <= end_date,
            CalendarEvent.sync_status == "synced"
        ).values(last_synced_at=now)
        
        await self.db.execute(stmt)
        await self.db.commit() 
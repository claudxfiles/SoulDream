from datetime import datetime, timedelta
import json
import logging
from typing import List, Optional, Dict, Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.models.calendar import CalendarEvent
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    """Servicio para interactuar con la API de Google Calendar."""
    
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    
    def __init__(self, credentials_json: str):
        """
        Inicializa el servicio con las credenciales proporcionadas.
        
        Args:
            credentials_json: String JSON con las credenciales de Google OAuth2
        """
        try:
            credentials_dict = json.loads(credentials_json)
            self.credentials = Credentials(
                token=credentials_dict.get('access_token'),
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=credentials_dict.get('client_id'),
                client_secret=credentials_dict.get('client_secret'),
                scopes=self.SCOPES,
                expiry=datetime.fromtimestamp(credentials_dict.get('expires_at', 0))
            )
            
            self.service = build('calendar', 'v3', credentials=self.credentials)
            self.calendar_id = 'primary'  # Por defecto, usar el calendario primario del usuario
        except Exception as e:
            logger.error(f"Error inicializando el servicio de Google Calendar: {str(e)}")
            raise
    
    def get_events(self, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """
        Obtiene eventos de Google Calendar en el rango de tiempo especificado.
        
        Args:
            start_time: Fecha y hora de inicio
            end_time: Fecha y hora de fin
            
        Returns:
            Lista de eventos de Google Calendar
        """
        try:
            events_result = self.service.events().list(
                calendarId=self.calendar_id,
                timeMin=start_time.isoformat() + 'Z',
                timeMax=end_time.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
        except HttpError as error:
            logger.error(f"Error obteniendo eventos de Google Calendar: {error}")
            raise
    
    def create_event(self, event: CalendarEventCreate) -> Dict[str, Any]:
        """
        Crea un evento en Google Calendar.
        
        Args:
            event: Datos del evento a crear
            
        Returns:
            Evento creado en Google Calendar
        """
        try:
            event_data = {
                'summary': event.title,
                'description': event.description or '',
                'start': self._format_datetime(event.start_time, event.is_all_day),
                'end': self._format_datetime(event.end_time, event.is_all_day),
                'colorId': self._get_color_id(event.color) if event.color else None,
            }
            
            if event.location:
                event_data['location'] = event.location
                
            if event.recurrence_rule:
                event_data['recurrence'] = [f'RRULE:{event.recurrence_rule}']
            
            created_event = self.service.events().insert(
                calendarId=self.calendar_id, 
                body=event_data
            ).execute()
            
            return created_event
        except HttpError as error:
            logger.error(f"Error creando evento en Google Calendar: {error}")
            raise
    
    def update_event(self, google_event_id: str, event: CalendarEventUpdate) -> Dict[str, Any]:
        """
        Actualiza un evento existente en Google Calendar.
        
        Args:
            google_event_id: ID del evento en Google Calendar
            event: Datos actualizados del evento
            
        Returns:
            Evento actualizado en Google Calendar
        """
        try:
            # Primero obtener el evento existente
            existing_event = self.service.events().get(
                calendarId=self.calendar_id,
                eventId=google_event_id
            ).execute()
            
            # Actualizar solo los campos que se proporcionan
            event_data = {}
            
            if event.title is not None:
                event_data['summary'] = event.title
                
            if event.description is not None:
                event_data['description'] = event.description
            
            if event.start_time is not None and event.is_all_day is not None:
                event_data['start'] = self._format_datetime(event.start_time, event.is_all_day)
                
            if event.end_time is not None and event.is_all_day is not None:
                event_data['end'] = self._format_datetime(event.end_time, event.is_all_day)
                
            if event.location is not None:
                event_data['location'] = event.location
                
            if event.color is not None:
                event_data['colorId'] = self._get_color_id(event.color)
                
            if event.recurrence_rule is not None:
                event_data['recurrence'] = [f'RRULE:{event.recurrence_rule}'] if event.recurrence_rule else []
            
            # Combinar con el evento existente
            updated_event = {**existing_event, **event_data}
            
            result = self.service.events().update(
                calendarId=self.calendar_id,
                eventId=google_event_id,
                body=updated_event
            ).execute()
            
            return result
        except HttpError as error:
            logger.error(f"Error actualizando evento en Google Calendar: {error}")
            raise
    
    def delete_event(self, google_event_id: str) -> bool:
        """
        Elimina un evento de Google Calendar.
        
        Args:
            google_event_id: ID del evento en Google Calendar
            
        Returns:
            True si se eliminó correctamente
        """
        try:
            self.service.events().delete(
                calendarId=self.calendar_id,
                eventId=google_event_id
            ).execute()
            return True
        except HttpError as error:
            logger.error(f"Error eliminando evento de Google Calendar: {error}")
            raise
    
    def _format_datetime(self, dt: datetime, is_all_day: bool) -> Dict[str, str]:
        """
        Formatea una fecha/hora para la API de Google Calendar.
        
        Args:
            dt: Fecha y hora
            is_all_day: Si es un evento de todo el día
            
        Returns:
            Diccionario con el formato adecuado para la API
        """
        if is_all_day:
            return {'date': dt.date().isoformat()}
        else:
            return {'dateTime': dt.isoformat()}
    
    def _get_color_id(self, color: str) -> str:
        """
        Mapea un color a un ID de color de Google Calendar.
        
        Args:
            color: Color en formato hexadecimal o nombre
            
        Returns:
            ID de color de Google Calendar
        """
        # Mapeo simplificado de colores comunes a IDs de Google Calendar
        color_mapping = {
            'blue': '1',
            'green': '2',
            'purple': '3',
            'red': '4',
            'yellow': '5',
            'orange': '6',
            'turquoise': '7',
            'gray': '8',
            'bold blue': '9',
            'bold green': '10',
            'bold red': '11'
        }
        
        # Si es un color hexadecimal, intentar mapear a uno de los colores predefinidos
        if color.startswith('#'):
            # Mapeo simplificado para ejemplos comunes, podría ser mejorado
            hex_mapping = {
                '#5484ED': '1',  # azul
                '#16A766': '2',  # verde
                '#7AE7BF': '3',  # verde claro
                '#FF887C': '4',  # rojo
                '#FBD75B': '5',  # amarillo
                '#FFB878': '6',  # naranja
                '#46D6DB': '7',  # turquesa
                '#E1E1E1': '8',  # gris
                '#5C9CCC': '9',  # azul fuerte
                '#B3DC6C': '10', # verde fuerte 
                '#DC4C3F': '11'  # rojo fuerte
            }
            return hex_mapping.get(color.upper(), '1')  # Default a azul
        
        return color_mapping.get(color.lower(), '1')  # Default a azul 
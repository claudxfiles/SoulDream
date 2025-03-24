import json
import logging
from fastapi import HTTPException, Depends
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.db.database import get_supabase_client
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)

async def get_user_google_credentials(user_id: str):
    """Obtiene las credenciales de Google del usuario desde Supabase"""
    try:
        supabase = get_supabase_client()
        
        # Buscar en user_metadata si hay tokens de Google
        user_response = await supabase.auth.admin.get_user_by_id(user_id)
        
        if user_response.error:
            logger.error(f"Error al obtener usuario: {user_response.error}")
            return None
            
        user_metadata = user_response.user.user_metadata
        google_token = user_metadata.get("google_token")
        
        if not google_token:
            logger.warning(f"No se encontraron tokens de Google para el usuario {user_id}")
            return None
            
        credentials = Credentials(
            token=google_token.get("access_token"),
            refresh_token=google_token.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=None,  # No es necesario para usar los tokens
            client_secret=None,  # No es necesario para usar los tokens
            scopes=["https://www.googleapis.com/auth/calendar"]
        )
        
        return credentials
    except Exception as e:
        logger.error(f"Error al obtener credenciales de Google: {e}")
        return None

async def get_calendar_service(user_id: str):
    """Crea un servicio de Google Calendar con las credenciales del usuario"""
    credentials = await get_user_google_credentials(user_id)
    
    if not credentials:
        raise HTTPException(status_code=401, detail="No se encontraron credenciales de Google Calendar")
    
    try:
        service = build("calendar", "v3", credentials=credentials)
        return service
    except Exception as e:
        logger.error(f"Error al crear servicio de Calendar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear servicio de Calendar: {str(e)}")

async def list_events(user_id: str, time_min: str, time_max: str, max_results: int = 100):
    """Lista los eventos del calendario del usuario"""
    try:
        service = await get_calendar_service(user_id)
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        return events
    except HttpError as e:
        error_content = json.loads(e.content)
        if error_content.get('error', {}).get('code') == 401:
            raise HTTPException(status_code=401, detail="Token de Google Calendar expirado o inválido")
        logger.error(f"Error al listar eventos: {e}")
        raise HTTPException(status_code=500, detail=f"Error al listar eventos: {str(e)}")
    except Exception as e:
        logger.error(f"Error al listar eventos: {e}")
        raise HTTPException(status_code=500, detail=f"Error al listar eventos: {str(e)}")

async def create_event(user_id: str, event_data: dict):
    """Crea un nuevo evento en el calendario del usuario"""
    try:
        service = await get_calendar_service(user_id)
        
        event = service.events().insert(
            calendarId='primary',
            body=event_data
        ).execute()
        
        return event
    except HttpError as e:
        error_content = json.loads(e.content)
        if error_content.get('error', {}).get('code') == 401:
            raise HTTPException(status_code=401, detail="Token de Google Calendar expirado o inválido")
        logger.error(f"Error al crear evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear evento: {str(e)}")
    except Exception as e:
        logger.error(f"Error al crear evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear evento: {str(e)}")

async def update_event(user_id: str, event_id: str, event_data: dict):
    """Actualiza un evento existente en el calendario del usuario"""
    try:
        service = await get_calendar_service(user_id)
        
        event = service.events().update(
            calendarId='primary',
            eventId=event_id,
            body=event_data
        ).execute()
        
        return event
    except HttpError as e:
        error_content = json.loads(e.content)
        if error_content.get('error', {}).get('code') == 401:
            raise HTTPException(status_code=401, detail="Token de Google Calendar expirado o inválido")
        logger.error(f"Error al actualizar evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar evento: {str(e)}")
    except Exception as e:
        logger.error(f"Error al actualizar evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar evento: {str(e)}")

async def delete_event(user_id: str, event_id: str):
    """Elimina un evento del calendario del usuario"""
    try:
        service = await get_calendar_service(user_id)
        
        service.events().delete(
            calendarId='primary',
            eventId=event_id
        ).execute()
        
        return {"status": "success", "message": "Evento eliminado correctamente"}
    except HttpError as e:
        error_content = json.loads(e.content)
        if error_content.get('error', {}).get('code') == 401:
            raise HTTPException(status_code=401, detail="Token de Google Calendar expirado o inválido")
        logger.error(f"Error al eliminar evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar evento: {str(e)}")
    except Exception as e:
        logger.error(f"Error al eliminar evento: {e}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar evento: {str(e)}") 
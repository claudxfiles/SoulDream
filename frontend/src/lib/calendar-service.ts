// Servicio para interactuar con las APIs de calendario

import { supabase } from "./supabase";
import type { CalendarEvent, EventSource } from '@/types/calendar';
import { parseISO, format, addHours, addMinutes, isSameDay, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

// Tipos para la integración con Google Calendar
type GoogleCalendarCredentials = {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
};

type CalendarEventInput = {
  title?: string;
  summary: string;
  description?: string;
  startDateTime: {
    dateTime: string;
    timeZone: string;
  };
  endDateTime: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  colorId?: string;
  type?: 'task' | 'goal' | 'habit' | 'workout' | 'custom';
  source?: 'local' | 'google';
  timezone?: string;
  goalId?: string;
  taskId?: string;
  habitId?: string;
  workoutId?: string;
};

type GoogleEventInput = {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  recurrence?: string[];
};

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string | null;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string | null;
  colorId?: string | null;
  recurrence?: string[] | null;
  status?: string;
};

// Enums para sincronización
export enum SyncDirection {
  PUSH = 'push',  // De local a Google
  PULL = 'pull',  // De Google a local
  BIDIRECTIONAL = 'bidirectional'  // Ambos
}

export enum SyncType {
  MANUAL = 'manual',  // Iniciado por el usuario
  AUTO = 'auto'       // Automático (ej: programado)
}

export type SyncStatus = 'local' | 'synced' | 'sync_failed' | 'deleted';

// Función para verificar y obtener credenciales de Google Calendar
export async function getCalendarCredentials(userId: string): Promise<GoogleCalendarCredentials | null> {
  try {
    // Primero intentar obtener de la tabla user_integrations
    const { data, error } = await supabase
      .from('user_integrations')
      .select('credentials')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    if (error) {
      console.error('Error al obtener credenciales de calendario:', error);
      // En caso de error, no abandonamos aquí, seguimos intentando otras fuentes
    }

    // Si encontramos credenciales en la tabla, devolverlas
    if (data && data.credentials) {
      // Credenciales encontradas en user_integrations
      return data.credentials as GoogleCalendarCredentials;
    }

    // Intentar primero con una llamada al backend para obtener metadatos
    // Esto evita depender de la sesión del usuario en el cliente
    try {
      const backendCredentials = await fetchUserMetadataFromBackend(userId);
      if (backendCredentials) {
        return backendCredentials;
      }
    } catch (backendError) {
      console.error('Error al obtener metadatos desde el backend:', backendError);
    }
    
    // Como último recurso, intentar obtener de los metadatos del usuario en la sesión
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error al obtener sesión de usuario:', authError);
        return null;
      }
      
      if (authData?.user?.user_metadata?.google_token) {
        const googleToken = authData.user.user_metadata.google_token;
        console.log('Credenciales de Google Calendar encontradas en metadatos de usuario');
        return {
          access_token: googleToken.access_token,
          refresh_token: googleToken.refresh_token,
          expiry_date: googleToken.expires_at * 1000 // Convertir a milisegundos
        };
      }
    } catch (authError) {
      console.error('Error al acceder a la sesión de autenticación:', authError);
    }
    
    console.log('No se encontraron credenciales de Google Calendar para el usuario');
    return null;
  } catch (error) {
    console.error('Error general en getCalendarCredentials:', error);
    return null;
  }
}

// Función auxiliar para obtener metadatos del usuario desde el backend
async function fetchUserMetadataFromBackend(userId: string): Promise<GoogleCalendarCredentials | null> {
  try {
    // Llamar a un endpoint específico que obtenga los metadatos del usuario
    // Sin depender de la sesión del cliente
    const response = await fetch(`/api/v1/auth/user-metadata?userId=${userId}`);
    
    if (!response.ok) {
      console.error('Error al obtener metadatos desde el backend');
      return null;
    }
    
    const data = await response.json();
    
    if (data?.google_token) {
      // Usar console.debug para información menos intrusiva
      console.debug('Credenciales de Google Calendar obtenidas desde backend');
      return {
        access_token: data.google_token.access_token,
        refresh_token: data.google_token.refresh_token,
        expiry_date: data.google_token.expires_at * 1000
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener metadatos desde el backend:', error);
    return null;
  }
}

// Función para refrescar el token de acceso si es necesario
export async function refreshTokenIfNeeded(userId: string, credentials: GoogleCalendarCredentials): Promise<GoogleCalendarCredentials> {
  // Si el token expira en menos de 5 minutos, refrescarlo
  if (credentials.expiry_date < Date.now() + 5 * 60 * 1000) {
    try {
      // Usar el endpoint de la API en lugar de la función Edge
      const response = await fetch('/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          refresh_token: credentials.refresh_token,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error refreshing token: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      // Actualizar las credenciales en la base de datos
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          credentials: {
            access_token: data.access_token,
            refresh_token: credentials.refresh_token, // Mantener el refresh token actual
            expiry_date: Date.now() + (data.expires_in * 1000)
          }
        })
        .eq('user_id', userId)
        .eq('provider', 'google_calendar');

      if (updateError) {
        console.error('Error crítico actualizando credenciales:', updateError);
      }

      return {
        access_token: data.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: Date.now() + (data.expires_in * 1000)
      };
    } catch (error) {
      console.error('Error in refreshTokenIfNeeded:', error);
      throw error;
    }
  }

  return credentials;
}

// Función para obtener eventos del calendario
export async function getCalendarEvents(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
  try {
    const credentials = await getCalendarCredentials(userId);
    
    if (!credentials || !credentials.access_token) {
      // Redirigir directamente a la reconexión con todos los permisos necesarios
      window.location.href = `/auth/reconnect?source=calendar_setup&forceConsent=true&userId=${userId}&scopes=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly')}`;
      throw new Error('Redirigiendo para obtener permisos de Google Calendar...');
    }
    
    // Asegurarse de que las fechas estén en formato ISO
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    // Construir URL para la API
    const apiUrl = new URL('/api/v1/calendar/events', window.location.origin);
    apiUrl.searchParams.append('timeMin', timeMin);
    apiUrl.searchParams.append('timeMax', timeMax);
    
    // Realizar la solicitud a nuestra API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Si hay error 403, intentar reparar una vez y si falla, redirigir a reconexión
      if (response.status === 403) {
        console.error('Error 403: Permisos insuficientes, intentando reparar...');
        
        try {
          const repairResult = await repairGoogleTokens(userId);
          
          if (repairResult.success) {
            console.log('Tokens reparados exitosamente, reintentando...');
            return getCalendarEvents(userId, startDate, endDate);
          }
        } catch (repairError) {
          console.error('Error al reparar tokens:', repairError);
        }
        
        // Si la reparación falla, redirigir a reconexión con todos los permisos
        window.location.href = `/auth/reconnect?source=calendar_insufficient_scopes&forceConsent=true&userId=${userId}&scopes=${encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly')}`;
        throw new Error('Redirigiendo para obtener permisos adicionales...');
      }
      
      // Manejar otros tipos de errores
      console.error('Error fetching calendar events:', errorData);
      throw new Error(errorData.error || `Error al obtener eventos (${response.status})`);
    }
    
    const googleEvents = await response.json();
    
    // Transformar eventos de Google a nuestro formato
    return googleEvents.map((event: GoogleCalendarEvent) => {
      return {
        id: event.id,
        title: event.summary,
        description: event.description || '',
        start: event.start.dateTime || event.start.date || '',
        end: event.end.dateTime || event.end.date || '',
        location: event.location || '',
        color: event.colorId || '',
        isAllDay: !!event.start.date,
        source: 'google' as EventSource,
      };
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

// Función para reparar tokens de Google cuando hay problemas con ellos
async function repairGoogleTokens(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Intentando reparar tokens de Google para el usuario:', userId);
    
    // Llamar a nuestro API endpoint para reparar tokens
    const response = await fetch(`/api/v1/auth/repair-tokens?userId=${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error desconocido reparando tokens');
    }
    
    // Si la reparación indica que se necesita reconexión completa, redirigir a la página de reconexión
    if (data.needsFullReconnect) {
      console.log('Se requiere reconexión completa con Google Calendar');
      
      // Redirigir a la página de reconexión
      // No redirigir inmediatamente para evitar problemas con localStorage o state
      setTimeout(() => {
        window.location.href = `/auth/reconnect?source=calendar_repair&userId=${userId}&forceConsent=true`;
      }, 100);
      
      return {
        success: false,
        message: 'Se requiere reconexión completa con Google Calendar'
      };
    }
    
    // Si la reparación fue exitosa
    return {
      success: true,
      message: data.message || 'Tokens reparados exitosamente'
    };
  } catch (error) {
    console.error('Error reparando tokens de Google:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido al reparar tokens'
    };
  }
}

// Función para crear un evento en Google Calendar
export async function createGoogleCalendarEvent(
  userId: string, 
  eventData: CalendarEventInput
): Promise<string | null> {
  try {
    // Obtener credenciales de Google Calendar
    const credentials = await getCalendarCredentials(userId);
    if (!credentials) {
      throw new Error('No se encontraron credenciales de Google Calendar');
    }

    // Refrescar token si es necesario
    const refreshedCredentials = await refreshTokenIfNeeded(userId, credentials);

    // Preparar datos del evento para Google Calendar
    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startDateTime.dateTime,
        timeZone: eventData.startDateTime.timeZone
      },
      end: {
        dateTime: eventData.endDateTime.dateTime,
        timeZone: eventData.endDateTime.timeZone
      }
    };

    // Llamar a la API de Google Calendar para crear el evento
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshedCredentials.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating Google Calendar event:', errorData);
      throw new Error('Error al crear evento en Google Calendar');
    }

    const data = await response.json();
    
    // Guardar la relación del evento en nuestra base de datos
    const eventRelation = {
      user_id: userId,
      google_event_id: data.id,
      goal_id: eventData.goalId || null,
      task_id: eventData.taskId || null,
      habit_id: eventData.habitId || null,
      workout_id: eventData.workoutId || null,
      event_title: eventData.title,
      start_time: eventData.startDateTime.dateTime,
      end_time: eventData.endDateTime.dateTime
    };

    const { error } = await supabase
      .from('calendar_event_relations')
      .insert(eventRelation);

    if (error) {
      console.error('Error saving calendar event relation:', error);
    }

    return data.id;
  } catch (error) {
    console.error('Error in createGoogleCalendarEvent:', error);
    throw error;
  }
}

// Función para añadir un workout al calendario
export async function addWorkoutToCalendar(eventData: CalendarEventInput): Promise<string | null> {
  // Obtener el ID de usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Crear el evento en Google Calendar
    const eventId = await createGoogleCalendarEvent(user.id, eventData);
    return eventId;
  } catch (error) {
    console.error('Error al añadir workout al calendario:', error);
    throw error;
  }
}

// Función para crear un evento en el calendario
export async function createCalendarEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  location,
  colorId,
  type = 'custom',
  source = 'local',
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
}: CalendarEventInput) {
  try {
    // Validar campos requeridos con logging detallado
    console.log('Datos recibidos en createCalendarEvent:', JSON.stringify({
      summary,
      startDateTime,
      endDateTime,
      location,
      colorId,
      type,
      source,
      timezone
    }, null, 2));

    if (!summary || !startDateTime || !endDateTime) {
      const missingFields = [];
      if (!summary) missingFields.push('summary');
      if (!startDateTime) missingFields.push('startDateTime');
      if (!endDateTime) missingFields.push('endDateTime');
      
      console.error('Campos faltantes:', missingFields);
      throw new Error(`Se requieren título, fecha de inicio y fecha de fin`);
    }

    // Validar que las fechas sean válidas
    if (!startDateTime.dateTime || !startDateTime.timeZone || !endDateTime.dateTime || !endDateTime.timeZone) {
      console.error('Formato de fecha inválido:', {
        startDateTime: JSON.stringify(startDateTime),
        endDateTime: JSON.stringify(endDateTime)
      });
      throw new Error('Las fechas deben incluir dateTime y timeZone');
    }

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime.dateTime,
        timeZone: startDateTime.timeZone
      },
      end: {
        dateTime: endDateTime.dateTime,
        timeZone: endDateTime.timeZone
      },
      location,
      colorId
    };

    console.log('Enviando evento al calendario:', JSON.stringify(event, null, 2));

    const response = await fetch('/api/v1/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.error || 'Error al crear evento en el calendario');
    }

    const responseData = await response.json();
    console.log('Respuesta del servidor:', JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error) {
    console.error('Error al crear evento en el calendario:', error);
    throw error;
  }
}

// Función para actualizar un evento en el calendario
export async function updateCalendarEvent(
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    location?: string;
    colorId?: string;
    calendarId?: string;
  }
) {
  try {
    const { calendarId = 'primary', ...eventData } = event;
    
    // Convertir fechas a ISO string si existen
    const payload = {
      ...eventData,
      startDateTime: eventData.startDateTime?.toISOString(),
      endDateTime: eventData.endDateTime?.toISOString(),
      calendarId,
    };
    
    const response = await fetch(`/api/v1/calendar/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar evento en el calendario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar evento en el calendario:', error);
    throw error;
  }
}

// Función para eliminar un evento del calendario
export async function deleteCalendarEvent(eventId: string, calendarId = 'primary') {
  try {
    const response = await fetch(`/api/v1/calendar/${eventId}?calendarId=${calendarId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar evento del calendario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al eliminar evento del calendario:', error);
    throw error;
  }
}

// Función para obtener los calendarios del usuario
export async function getUserCalendars() {
  try {
    const response = await fetch('/api/v1/calendar/userCalendars');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener calendarios del usuario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener calendarios del usuario:', error);
    throw error;
  }
}

// Función para sincronizar una tarea con el calendario
export async function syncTaskWithCalendar(task: {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  timezone?: string;
  duration_minutes?: number;
  status: string;
  priority: string;
}) {
  if (!task.due_date) {
    throw new Error('La tarea no tiene fecha límite definida');
  }

  try {
    // Obtener la zona horaria del usuario o usar la del sistema
    const userTimezone = task.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Asegurarse de que la fecha esté en formato YYYY-MM-DD
    const dateOnly = task.due_date.split('T')[0];
    
    // Combinar fecha y hora en la zona horaria del usuario
    const dueDateTime = task.due_time 
      ? `${dateOnly}T${task.due_time}`
      : `${dateOnly}T${task.due_time || '21:00:00'}`; // Hora por defecto 21:00

    // Logs de diagnóstico
    console.log('Datos de la tarea:', JSON.stringify({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      due_time: task.due_time,
      timezone: userTimezone,
      duration_minutes: task.duration_minutes,
      status: task.status,
      priority: task.priority
    }, null, 2));

    console.log('Fecha y hora combinada:', dueDateTime);

    // Formatear la descripción con emojis y detalles
    const description = `🎯 Tarea: ${task.description || task.title}
📊 Prioridad: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
📌 Estado: ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
⏱️ Duración: ${task.duration_minutes || 30} minutos
🌐 Zona horaria: ${userTimezone}
🔗 ID: ${task.id}`;

    // Asignar color según prioridad
    const colorId = (() => {
      switch (task.priority.toLowerCase()) {
        case 'high': return '4';    // Rojo
        case 'medium': return '5';   // Amarillo
        case 'low': return '9';     // Verde
        default: return '1';         // Azul
      }
    })();

    // Calcular la fecha de fin basada en la duración especificada
    const startDate = new Date(dueDateTime);
    const endDate = addMinutes(startDate, task.duration_minutes || 30);

    // Crear el evento asegurando que las fechas estén en la zona horaria correcta
    const eventData: CalendarEventInput = {
      summary: `📋 ${task.title}`,
      description,
      startDateTime: {
        dateTime: startDate.toISOString().replace('Z', ''),
        timeZone: userTimezone
      },
      endDateTime: {
        dateTime: endDate.toISOString().replace('Z', ''),
        timeZone: userTimezone
      },
      colorId,
      type: 'task',
      source: 'local',
      timezone: userTimezone
    };

    console.log('Datos del evento a crear:', JSON.stringify(eventData, null, 2));

    // Crear el evento
    const event = await createCalendarEvent(eventData);

    return event;
  } catch (error: any) {
    console.error('Error al sincronizar tarea con calendario:', error);
    throw new Error(error.message || 'Error al crear el evento en el calendario');
  }
}

// Función para sincronizar calendarios
export async function syncUserCalendar(
  userId: string, 
  startDate: Date, 
  endDate: Date, 
  direction = SyncDirection.BIDIRECTIONAL,
  syncType = SyncType.MANUAL
): Promise<{
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}> {
  const result = {
    success: false,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    errors: [] as string[]
  };

  try {
    // Validar fechas
    if (!startDate || !endDate || startDate > endDate) {
      throw new Error('Fechas de sincronización inválidas');
    }

    // Verificar que el usuario está autenticado y coincide con el userId proporcionado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error crítico de autenticación:', sessionError);
      throw new Error('Error de autenticación');
    }

    if (!session) {
      console.error('Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    if (session.user.id !== userId) {
      console.error('ID de usuario no coincide');
      throw new Error('ID de usuario no coincide con el usuario autenticado');
    }

    console.log('Iniciando sincronización para usuario:', userId);
    console.log('Rango de fechas:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Crear el registro de sincronización
    const { data: syncLog, error: syncLogError } = await supabase
      .from('calendar_sync_logs')
      .insert({
        user_id: userId,
        sync_type: syncType,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        events_created: 0,
        events_updated: 0,
        events_deleted: 0
      })
      .select('id')
      .single();

    if (syncLogError) {
      console.error('Error crítico al crear registro de sincronización:', syncLogError);
      throw new Error('Error al crear registro de sincronización');
    }

    const syncLogId = syncLog?.id;
    console.log('Registro de sincronización creado con ID:', syncLogId);

    // Obtener credenciales de Google Calendar
    const credentials = await getCalendarCredentials(userId);
    if (!credentials) {
      console.error('No se encontraron credenciales de Google Calendar');
      result.errors.push('No se encontraron credenciales de Google Calendar');
      if (syncLogId) {
        await updateSyncLog(syncLogId, 'failed', result);
      }
      return result;
    }

    // Refrescar token si es necesario
    const refreshedCredentials = await refreshTokenIfNeeded(userId, credentials);
    console.log('Token de acceso refrescado correctamente');
    
    try {
      // Realizar sincronización según la dirección especificada
      if (direction === SyncDirection.PULL || direction === SyncDirection.BIDIRECTIONAL) {
        // Obtener eventos de Google Calendar
        const googleEvents = await fetchGoogleCalendarEvents(refreshedCredentials.access_token, startDate, endDate);
        
        // Obtener eventos locales para el rango de fechas
        const { data: localEvents, error: localEventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', startDate.toISOString())
          .lte('end_time', endDate.toISOString());
          
        if (localEventsError) {
          result.errors.push(`Error al obtener eventos locales: ${localEventsError.message}`);
        }
        
        // Mapear eventos de Google por ID para facilitar la búsqueda
        const googleEventsMap = new Map<string, GoogleCalendarEvent>();
        googleEvents.forEach(event => {
          googleEventsMap.set(event.id, event);
        });
        
        // Mapear eventos locales por Google ID para facilitar la búsqueda
        const localEventsByGoogleId = new Map();
        localEvents?.forEach(event => {
          if (event.google_event_id) {
            localEventsByGoogleId.set(event.google_event_id, event);
          }
        });
        
        // Procesar eventos de Google
        for (const googleEvent of googleEvents) {
          const localEvent = localEventsByGoogleId.get(googleEvent.id);
          
          if (localEvent) {
            // El evento existe localmente, actualizar si es necesario
            if (needsUpdate(googleEvent, localEvent)) {
              const { error: updateError } = await supabase
                .from('calendar_events')
                .update({
                  title: googleEvent.summary,
                  description: googleEvent.description || '',
                  start_time: googleEvent.start.dateTime || googleEvent.start.date,
                  end_time: googleEvent.end.dateTime || googleEvent.end.date,
                  location: googleEvent.location || '',
                  is_all_day: !googleEvent.start.dateTime,
                  color: googleEvent.colorId || null,
                  updated_at: new Date().toISOString(),
                  last_synced_at: new Date().toISOString(),
                  sync_status: 'synced'
                })
                .eq('id', localEvent.id);
                
              if (updateError) {
                result.errors.push(`Error al actualizar evento local: ${updateError.message}`);
              } else {
                result.eventsUpdated++;
              }
            } else {
              // Actualizar solo el estado de sincronización
              await supabase
                .from('calendar_events')
                .update({
                  last_synced_at: new Date().toISOString(),
                  sync_status: 'synced'
                })
                .eq('id', localEvent.id);
            }
          } else {
            // Crear evento local desde Google
            const newEvent = {
                user_id: userId,
                title: googleEvent.summary || 'Sin título',
                description: googleEvent.description || '',
                start_time: new Date(googleEvent.start.dateTime || googleEvent.start.date || new Date()).toISOString(),
                end_time: new Date(googleEvent.end.dateTime || googleEvent.end.date || new Date()).toISOString(),
                location: googleEvent.location || '',
                is_all_day: !googleEvent.start.dateTime,
                color: googleEvent.colorId || null,
                google_event_id: googleEvent.id,
                sync_status: 'synced',
                last_synced_at: new Date().toISOString(),
                is_recurring: googleEvent.recurrence ? true : false,
                recurrence_rule: googleEvent.recurrence ? googleEvent.recurrence[0] : null,
                type: 'custom',
                source: 'google'
            };

            // Log detallado antes de la validación
            console.log('Evento a validar:', {
                ...newEvent,
                user_id_type: typeof newEvent.user_id,
                user_id_valid: isValidUUID(newEvent.user_id),
                title_type: typeof newEvent.title,
                start_time_type: typeof newEvent.start_time,
                end_time_type: typeof newEvent.end_time,
                start_time_valid: isValidISODate(newEvent.start_time),
                end_time_valid: isValidISODate(newEvent.end_time)
            });

            // Validar el evento antes de insertarlo
            const validation = validateCalendarEvent(newEvent);
            
            // Log detallado del evento y su validación
            console.log('Detalles del evento a insertar:', {
                evento: newEvent,
                validacion: validation,
                eventoGoogle: {
                    id: googleEvent.id,
                    summary: googleEvent.summary,
                    start: googleEvent.start,
                    end: googleEvent.end,
                    raw: googleEvent
                }
            });

            if (!validation.isValid) {
                console.error('Error crítico de validación:', validation.errors);
                throw new Error('Error de validación de evento');
            }

            // Intentar insertar el evento
            const { data: insertedEvent, error: insertError } = await supabase
                .from('calendar_events')
                .insert(newEvent)
                .select()
                .single();

            if (insertError) {
                console.error('Error crítico al insertar evento:', {
                    error: insertError,
                    datosEvento: newEvent,
                    datosGoogleEvent: googleEvent,
                    validacionResultado: validation
                });
                result.errors.push(`Error al insertar evento: ${insertError.message} - Detalles: ${insertError.details || 'No hay detalles adicionales'}`);
            } else {
                console.log('Evento insertado exitosamente:', insertedEvent);
                result.eventsCreated++;
            }
          }
        }
        
        // Verificar eventos locales que ya no existen en Google (posiblemente eliminados)
        if (localEvents) {
          for (const localEvent of localEvents) {
            if (localEvent.google_event_id && !googleEventsMap.has(localEvent.google_event_id) && localEvent.sync_status !== 'local') {
              if (direction === SyncDirection.BIDIRECTIONAL) {
                // En sincronización bidireccional, marcamos como eliminado pero lo mantenemos localmente
                const { error: updateError } = await supabase
                  .from('calendar_events')
                  .update({
                    sync_status: 'deleted',
                    last_synced_at: new Date().toISOString()
                  })
                  .eq('id', localEvent.id);
                  
                if (updateError) {
                  result.errors.push(`Error al marcar evento como eliminado: ${updateError.message}`);
                } else {
                  result.eventsDeleted++;
                }
              } else {
                // En sincronización pull, eliminamos el evento local
                const { error: deleteError } = await supabase
                  .from('calendar_events')
                  .delete()
                  .eq('id', localEvent.id);
                  
                if (deleteError) {
                  result.errors.push(`Error al eliminar evento local: ${deleteError.message}`);
                } else {
                  result.eventsDeleted++;
                }
              }
            }
          }
        }
      }
      
      if (direction === SyncDirection.PUSH || direction === SyncDirection.BIDIRECTIONAL) {
        // Obtener eventos locales para sincronizar a Google
        const { data: localEvents, error: localEventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .in('sync_status', ['local', 'sync_failed'])
          .gte('start_time', startDate.toISOString())
          .lte('end_time', endDate.toISOString());
          
        if (localEventsError) {
          result.errors.push(`Error al obtener eventos locales para sincronizar: ${localEventsError.message}`);
        } else if (localEvents) {
          // Sincronizar eventos locales a Google
          for (const localEvent of localEvents) {
            try {
              const googleEvent = await pushEventToGoogle(localEvent, refreshedCredentials.access_token);
              
              let response;
              
              if (localEvent.google_event_id) {
                // Actualizar evento existente en Google
                response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${localEvent.google_event_id}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${refreshedCredentials.access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(googleEvent)
                });
              } else {
                // Crear nuevo evento en Google
                response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${refreshedCredentials.access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(googleEvent)
                });
              }
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error API Google: ${errorData.error?.message || JSON.stringify(errorData)}`);
              }
              
              const data = await response.json();
              
              // Actualizar evento local con ID de Google y estado
              const { error: updateError } = await supabase
                .from('calendar_events')
                .update({
                  google_event_id: data.id,
                  sync_status: 'synced',
                  last_synced_at: new Date().toISOString()
                })
                .eq('id', localEvent.id);
                
                if (updateError) {
                  throw new Error(`Error actualización DB: ${updateError.message}`);
                }
                
                if (localEvent.google_event_id) {
                  result.eventsUpdated++;
                } else {
                  result.eventsCreated++;
                }
            } catch (error: any) {
              console.error(`Error crítico sincronizando evento ${localEvent.id}:`, error);
              
              // Marcar evento como fallido en sincronización
              await supabase
                .from('calendar_events')
                .update({
                  sync_status: 'sync_failed',
                  last_synced_at: new Date().toISOString()
                })
                .eq('id', localEvent.id);
                
              result.errors.push(`Error en evento ${localEvent.id}: ${error.message}`);
            }
          }
        }
        
        // Manejar eventos marcados para eliminación en Google
        const { data: deletedEvents, error: deletedEventsError } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', userId)
          .eq('sync_status', 'deleted')
          .not('google_event_id', 'is', null);
          
        if (deletedEventsError) {
          console.error('Error crítico al procesar eventos eliminados:', deletedEventsError);
          result.errors.push(`Error al obtener eventos eliminados: ${deletedEventsError.message}`);
        } else if (deletedEvents) {
          for (const event of deletedEvents) {
            try {
              // Eliminar evento en Google
              const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.google_event_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${refreshedCredentials.access_token}`
                }
              });
              
              if (!response.ok && response.status !== 410) { // 410 Gone significa que ya fue eliminado
                const errorData = await response.json();
                throw new Error(`Error API Google: ${errorData.error?.message || JSON.stringify(errorData)}`);
              }
              
              // Eliminar evento local o actualizar su estado
              const { error: deleteError } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', event.id);
                
              if (deleteError) {
                throw new Error(`Error eliminación DB: ${deleteError.message}`);
              }
              
              result.eventsDeleted++;
            } catch (error: any) {
              console.error(`Error eliminando evento ${event.id} de Google:`, error);
              result.errors.push(`Error eliminando evento ${event.id}: ${error.message}`);
            }
          }
        }
      }
      
      // Establecer éxito basado en si hay errores
      result.success = result.errors.length === 0;
      
      // Actualizar registro de sincronización
      await updateSyncLog(syncLogId, result.success ? 'success' : result.errors.length < 5 ? 'partial' : 'failed', result);
      
      return result;
    } catch (error: any) {
      console.error('Error en la sincronización del calendario:', error);
      result.errors.push(`Error general: ${error.message}`);
      result.success = false;
      
      // Actualizar registro de sincronización
      await updateSyncLog(syncLogId, 'failed', result);
      
      return result;
    }
  } catch (error: any) {
    console.error('Error crítico en syncUserCalendar:', error);
    return {
      success: false,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [`Error crítico: ${error.message}`]
    };
  }
}

// Funciones auxiliares para la sincronización

// Función auxiliar para actualizar el registro de sincronización
async function updateSyncLog(
  syncLogId: string | null | undefined, 
  status: string, 
  result: { 
    eventsCreated: number; 
    eventsUpdated: number; 
    eventsDeleted: number; 
    errors: string[] 
  }
): Promise<void> {
  // Si no hay ID, no podemos actualizar nada
  if (!syncLogId) {
    console.log('No hay ID de registro de sincronización para actualizar');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('calendar_sync_logs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        events_created: result.eventsCreated,
        events_updated: result.eventsUpdated,
        events_deleted: result.eventsDeleted,
        error_message: result.errors.length > 0 ? result.errors[0] : null,
        error_details: result.errors.length > 0 ? { errors: result.errors } : null
      })
      .eq('id', syncLogId);
    
    if (error) {
      console.error('Error crítico actualizando registro de sincronización:', error);
    }
  } catch (error) {
    console.error('Exception updating sync log:', error);
  }
}

// Función para obtener eventos de Google Calendar
async function fetchGoogleCalendarEvents(
  accessToken: string, 
  startDate: Date, 
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  try {
    if (!accessToken) {
      throw new Error('Token de acceso no proporcionado');
    }

    // Formatear fechas para la API
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    console.log('Obteniendo eventos de Google Calendar:', {
      timeMin,
      timeMax,
      hasAccessToken: !!accessToken
    });

    // Llamar a la API de Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la respuesta de Google Calendar:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Error API Google (${response.status}): ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    console.log(`Eventos obtenidos de Google Calendar: ${data.items?.length || 0}`);
    return data.items || [];
  } catch (error) {
    console.error('Error en fetchGoogleCalendarEvents:', error);
    throw error;
  }
}

// Función para determinar si un evento local necesita ser actualizado
function needsUpdate(googleEvent: GoogleCalendarEvent, localEvent: any): boolean {
  // Verificar cambios en propiedades básicas
  if (googleEvent.summary !== localEvent.title) return true;
  if ((googleEvent.description || '') !== (localEvent.description || '')) return true;
  if ((googleEvent.location || '') !== (localEvent.location || '')) return true;
  
  // Verificar fechas
  const googleStart = googleEvent.start.dateTime || googleEvent.start.date;
  const googleEnd = googleEvent.end.dateTime || googleEvent.end.date;
  
  if (googleStart !== localEvent.start_time) return true;
  if (googleEnd !== localEvent.end_time) return true;
  
  // Verificar si es todo el día
  const isAllDay = !googleEvent.start.dateTime;
  if (isAllDay !== localEvent.is_all_day) return true;
  
  // Verificar color
  if ((googleEvent.colorId || '') !== (localEvent.color || '')) return true;
  
  return false;
}

// Función para sincronizar eventos locales a Google
async function pushEventToGoogle(localEvent: any, accessToken: string): Promise<any> {
  // Validar que el evento tenga los campos requeridos
  if (!localEvent.title || !localEvent.start_time || !localEvent.end_time) {
    console.error('Evento inválido:', localEvent);
    throw new Error('Evento inválido: faltan campos requeridos (título, fecha inicio, fecha fin)');
  }

  // Asegurarse de que las fechas sean válidas
  const startTime = new Date(localEvent.start_time);
  const endTime = new Date(localEvent.end_time);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error('Fechas inválidas:', { start: localEvent.start_time, end: localEvent.end_time });
    throw new Error('Fechas inválidas en el evento');
  }

  // Asegurarse de que la fecha de fin no sea anterior a la de inicio
  if (endTime < startTime) {
    console.error('La fecha de fin es anterior a la fecha de inicio:', { start: startTime, end: endTime });
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const googleEvent: GoogleEventInput = {
    summary: localEvent.title,
    description: localEvent.description || '',
    start: localEvent.is_all_day
      ? { 
          date: format(startTime, 'yyyy-MM-dd'),
          timeZone
        }
      : { 
          dateTime: startTime.toISOString(),
          timeZone
        },
    end: localEvent.is_all_day
      ? { 
          date: format(endTime, 'yyyy-MM-dd'),
          timeZone
        }
      : { 
          dateTime: endTime.toISOString(),
          timeZone
        }
  };

  // Añadir campos opcionales solo si existen y son válidos
  if (localEvent.location && typeof localEvent.location === 'string') {
    googleEvent.location = localEvent.location;
  }

  if (localEvent.color && typeof localEvent.color === 'string') {
    googleEvent.colorId = localEvent.color;
  }
  
  // Añadir regla de recurrencia si existe y es válida
  if (localEvent.recurrence_rule && typeof localEvent.recurrence_rule === 'string') {
    googleEvent.recurrence = [localEvent.recurrence_rule];
  }

  console.log('Enviando evento a Google Calendar:', {
    ...googleEvent,
    accessTokenPresent: !!accessToken
  });
  
  return googleEvent;
}

// Función para validar un evento antes de insertarlo en Supabase
function validateCalendarEvent(event: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar campos requeridos y sus tipos
  if (!event.user_id) {
    errors.push('user_id es requerido');
  } else if (typeof event.user_id !== 'string' || !isValidUUID(event.user_id)) {
    errors.push(`user_id debe ser un UUID válido, recibido: ${typeof event.user_id}`);
  }

  if (!event.title) {
    errors.push('title es requerido');
  } else if (typeof event.title !== 'string') {
    errors.push(`title debe ser string, recibido: ${typeof event.title}`);
  }

  if (!event.type) {
    errors.push('type es requerido');
  } else if (typeof event.type !== 'string') {
    errors.push(`type debe ser string, recibido: ${typeof event.type}`);
  }

  if (!event.source) {
    errors.push('source es requerido');
  } else if (typeof event.source !== 'string') {
    errors.push(`source debe ser string, recibido: ${typeof event.source}`);
  }

  // Validar fechas
  if (!event.start_time) {
    errors.push('start_time es requerido');
  } else if (!isValidISODate(event.start_time)) {
    errors.push(`start_time debe ser una fecha ISO válida, recibido: ${event.start_time}`);
  }

  if (!event.end_time) {
    errors.push('end_time es requerido');
  } else if (!isValidISODate(event.end_time)) {
    errors.push(`end_time debe ser una fecha ISO válida, recibido: ${event.end_time}`);
  }

  // Validar que end_time sea después de start_time
  if (event.start_time && event.end_time && isValidISODate(event.start_time) && isValidISODate(event.end_time)) {
    if (new Date(event.end_time) <= new Date(event.start_time)) {
      errors.push('end_time debe ser posterior a start_time');
    }
  }

  // Validar campos opcionales si están presentes
  if (event.description !== undefined && typeof event.description !== 'string') {
    errors.push('description debe ser string');
  }

  if (event.location !== undefined && typeof event.location !== 'string') {
    errors.push('location debe ser string');
  }

  if (event.color !== undefined && event.color !== null && typeof event.color !== 'string') {
    errors.push('color debe ser string o null');
  }

  if (event.is_all_day !== undefined && typeof event.is_all_day !== 'boolean') {
    errors.push('is_all_day debe ser boolean');
  }

  if (event.is_recurring !== undefined && typeof event.is_recurring !== 'boolean') {
    errors.push('is_recurring debe ser boolean');
  }

  if (event.recurrence_rule !== undefined && event.recurrence_rule !== null && typeof event.recurrence_rule !== 'string') {
    errors.push('recurrence_rule debe ser string o null');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Función auxiliar para validar UUIDs
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Función auxiliar para validar fechas ISO
function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
  } catch {
    return false;
  }
} 
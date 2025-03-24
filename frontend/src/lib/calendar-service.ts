// Servicio para interactuar con las APIs de calendario

import { supabase } from "./supabase";
import type { CalendarEvent, EventSourceType } from '@/types/calendar';
import { parseISO, format, addHours, addMinutes, isSameDay, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

// Tipos para la integración con Google Calendar
type GoogleCalendarCredentials = {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
};

type CalendarEventInput = {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  goalId?: string;
  taskId?: string;
  habitId?: string;
  workoutId?: string;
  location?: string;
  recurrenceRule?: string;
  isAllDay?: boolean;
  color?: string;
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
      console.log('Credenciales de Google Calendar encontradas en user_integrations');
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
      const { data, error } = await supabase.functions.invoke('refresh-google-token', {
        body: { refresh_token: credentials.refresh_token }
      });

      if (error || !data) {
        throw new Error(`Error refreshing token: ${error?.message || 'Unknown error'}`);
      }

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
        console.error('Error updating credentials:', updateError);
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
      console.error('No hay credenciales de Google Calendar disponibles');
      throw new Error('No estás conectado a Google Calendar');
    }
    
    // Asegurarse de que las fechas estén en formato ISO
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    // Construir URL para la API
    const apiUrl = new URL('/api/v1/calendar/events', window.location.origin);
    apiUrl.searchParams.append('timeMin', timeMin);
    apiUrl.searchParams.append('timeMax', timeMax);
    
    // Usar console.debug para reducir el ruido en la consola
    console.debug('GET', apiUrl.toString());
    
    // Realizar la solicitud a nuestra API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Detectar errores de permisos insuficientes
      if (response.status === 403 && errorData.errorCode === 'INSUFFICIENT_SCOPES') {
        console.error('Error 403 Forbidden: Permisos insuficientes para acceder al calendario');
        
        // Intentar reparar los tokens primero
        const repairResult = await repairGoogleTokens(userId);
        
        if (repairResult.success) {
          console.log('Tokens reparados exitosamente, reintentando...');
          return getCalendarEvents(userId, startDate, endDate);
        }
        
        // Si aún así falla, necesitamos reconexión con consentimiento forzado
        if (errorData.forceConsent) {
          // Redirigir a la página de reconexión con el parámetro forceConsent
          window.location.href = `/auth/reconnect?source=calendar_insufficient_scopes&forceConsent=true&userId=${userId}`;
          throw new Error('Redirigiendo para obtener permisos adicionales...');
        }
        
        throw new Error('Permisos insuficientes. Por favor, reconecta tu cuenta de Google Calendar.');
      }
      
      // Manejar otros tipos de errores
      if (response.status === 401 || response.status === 403 || errorData.needsReconnect) {
        console.error(`Error ${response.status}: ${errorData.error}`);
        
        // Intentar reparar los tokens primero
        const repairResult = await repairGoogleTokens(userId);
        
        if (repairResult.success) {
          console.log('Tokens reparados exitosamente, reintentando...');
          return getCalendarEvents(userId, startDate, endDate);
        }
        
        // Si la reparación falla, lanzar error para que la UI muestre mensaje de reconexión
        throw new Error('Error de autenticación con Google Calendar. Por favor, reconecta tu cuenta.');
      }
      
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
        source: 'google' as EventSourceType,
      };
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    
    // Propagar error para manejo en la UI
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
        dateTime: eventData.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
      start_time: eventData.startDateTime,
      end_time: eventData.endDateTime
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
export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
  colorId?: string;
  calendarId?: string;
}) {
  try {
    const { calendarId = 'primary', ...eventData } = event;
    
    const response = await fetch('/api/v1/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        startDateTime: eventData.startDateTime.toISOString(),
        endDateTime: eventData.endDateTime.toISOString(),
        calendarId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear evento en el calendario');
    }
    
    return await response.json();
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
  status: string;
  priority: string;
}) {
  if (!task.due_date) {
    throw new Error('La tarea no tiene fecha límite definida');
  }
  
  // Crear fecha de inicio (fecha límite de la tarea)
  const startDateTime = new Date(task.due_date);
  
  // Crear fecha de fin (1 hora después por defecto)
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + 1);
  
  // Crear el evento
  return createCalendarEvent({
    summary: task.title,
    description: `Tarea de SoulDream: ${task.description || ''}
Prioridad: ${task.priority}
Estado: ${task.status}`,
    startDateTime,
    endDateTime,
    // Asignar color según prioridad
    colorId: task.priority === 'high' ? '4' : (task.priority === 'medium' ? '5' : '9'),
  });
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
    // Omitir la verificación de autenticación y usar directamente el userId proporcionado
    console.log('Iniciando sincronización para usuario:', userId);

    // Variable para realizar seguimiento si podemos crear registros de sincronización
    let canCreateSyncLog = false; // Por defecto asumimos que no podemos crear logs
    let syncLogId = null;
    
    // Verificar si el usuario tiene permiso para crear registros (prueba simple)
    try {
      const testResult = await supabase
        .from('calendar_sync_logs')
        .select('count')
        .limit(1);
        
      if (!testResult.error) {
        console.log('Permisos verificados para tabla calendar_sync_logs');
        canCreateSyncLog = true;
      } else {
        console.warn('Problemas de permisos detectados, omitiendo creación de logs:', testResult.error.message);
      }
    } catch (permError) {
      console.error('Error al verificar permisos:', permError);
    }
    
    // Solo intentar crear el registro si tenemos permisos
    if (canCreateSyncLog) {
      try {
        const { data: syncLog, error: syncLogError } = await supabase
          .from('calendar_sync_logs')
          .insert({
            user_id: userId, // Usar el ID que se pasa como parámetro
            sync_type: syncType,
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (syncLogError) {
          console.error('Error al crear registro de sincronización:', syncLogError);
        } else if (syncLog) {
          syncLogId = syncLog.id;
          console.log('Registro de sincronización creado con ID:', syncLogId);
        }
      } catch (logError) {
        console.error('Excepción al crear registro de sincronización:', logError);
      }
    } else {
      console.log('Omitiendo creación de registro de sincronización debido a permisos insuficientes');
    }
    
    // Continuar con el proceso de sincronización independientemente del resultado anterior
    
    // Obtener credenciales de Google Calendar
    const credentials = await getCalendarCredentials(userId);
    if (!credentials) {
      result.errors.push('No se encontraron credenciales de Google Calendar');
      // Solo intentamos actualizar el log si se creó correctamente
      if (syncLogId) {
        await updateSyncLog(syncLogId, 'failed', result);
      }
      return result;
    }

    // Refrescar token si es necesario
    const refreshedCredentials = await refreshTokenIfNeeded(userId, credentials);
    
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
            const { error: insertError } = await supabase
              .from('calendar_events')
              .insert({
                user_id: userId,
                title: googleEvent.summary,
                description: googleEvent.description || '',
                start_time: googleEvent.start.dateTime || googleEvent.start.date,
                end_time: googleEvent.end.dateTime || googleEvent.end.date,
                location: googleEvent.location || '',
                is_all_day: !googleEvent.start.dateTime,
                color: googleEvent.colorId || null,
                google_event_id: googleEvent.id,
                sync_status: 'synced',
                last_synced_at: new Date().toISOString(),
                is_recurring: googleEvent.recurrence ? true : false,
                recurrence_rule: googleEvent.recurrence ? googleEvent.recurrence[0] : null
              });
              
            if (insertError) {
              result.errors.push(`Error al crear evento local: ${insertError.message}`);
            } else {
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
              const googleEvent = {
                summary: localEvent.title,
                description: localEvent.description || '',
                start: localEvent.is_all_day
                  ? { date: localEvent.start_time.substring(0, 10) }
                  : { 
                      dateTime: localEvent.start_time,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                end: localEvent.is_all_day
                  ? { date: localEvent.end_time.substring(0, 10) }
                  : { 
                      dateTime: localEvent.end_time,
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                location: localEvent.location || '',
                colorId: localEvent.color || undefined
              };
              
              // Añadir regla de recurrencia si existe
              if (localEvent.recurrence_rule) {
                googleEvent.recurrence = [localEvent.recurrence_rule];
              }
              
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
              console.error(`Error sincronizando evento ${localEvent.id} a Google:`, error);
              
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
          .is('google_event_id', 'not.null');
          
        if (deletedEventsError) {
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
      console.error('Error updating sync log:', error);
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
    // Formatear fechas para la API
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
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
      console.error('Error fetching Google Calendar events:', errorData);
      throw new Error(`Error API Google: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error in fetchGoogleCalendarEvents:', error);
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
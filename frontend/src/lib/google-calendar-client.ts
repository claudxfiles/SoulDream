'use client';

// Importar parche para node:events antes de cualquier otra importación
import '../patches/node-events-patch';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Función para crear un cliente autorizado de Google Calendar
export async function getGoogleCalendarClient(accessToken: string) {
  // Crear cliente OAuth2
  const auth = new OAuth2Client(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  );
  auth.setCredentials({ access_token: accessToken });

  // Crear cliente de Calendar
  return google.calendar({ version: 'v3', auth });
}

// Función para obtener eventos del calendario
export async function getCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarId = 'primary'
) {
  try {
    const calendar = await getGoogleCalendarClient(accessToken);

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    throw error;
  }
}

// Función para crear un evento en el calendario
export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    startDateTime: Date;
    endDateTime: Date;
    location?: string;
    colorId?: string;
  },
  calendarId = 'primary'
) {
  try {
    const calendar = await getGoogleCalendarClient(accessToken);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        colorId: event.colorId,
        start: {
          dateTime: event.startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al crear evento en el calendario:', error);
    throw error;
  }
}

// Función para actualizar un evento en el calendario
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    location?: string;
    colorId?: string;
  },
  calendarId = 'primary'
) {
  try {
    const calendar = await getGoogleCalendarClient(accessToken);

    // Construir el objeto de evento para la actualización
    const eventData: any = {};
    
    if (event.summary) eventData.summary = event.summary;
    if (event.description) eventData.description = event.description;
    if (event.location) eventData.location = event.location;
    if (event.colorId) eventData.colorId = event.colorId;
    
    if (event.startDateTime) {
      eventData.start = {
        dateTime: event.startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    if (event.endDateTime) {
      eventData.end = {
        dateTime: event.endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventData,
    });

    return response.data;
  } catch (error) {
    console.error('Error al actualizar evento en el calendario:', error);
    throw error;
  }
}

// Función para eliminar un evento del calendario
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = 'primary'
) {
  try {
    const calendar = await getGoogleCalendarClient(accessToken);

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return true;
  } catch (error) {
    console.error('Error al eliminar evento del calendario:', error);
    throw error;
  }
}

// Función para obtener los calendarios del usuario
export async function getUserCalendars(accessToken: string) {
  try {
    const calendar = await getGoogleCalendarClient(accessToken);

    const response = await calendar.calendarList.list();

    return response.data.items || [];
  } catch (error) {
    console.error('Error al obtener los calendarios del usuario:', error);
    throw error;
  }
}

// Función para sincronizar una tarea con el calendario
export async function syncTaskWithCalendar(
  accessToken: string,
  task: {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    status: string;
    priority: string;
  }
) {
  try {
    if (!task.due_date) {
      throw new Error('La tarea no tiene fecha límite definida');
    }
    
    // Crear fecha de inicio (fecha límite de la tarea)
    const startDateTime = new Date(task.due_date);
    
    // Crear fecha de fin (1 hora después por defecto)
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);
    
    // Crear el evento
    const event = await createCalendarEvent(
      accessToken,
      {
        summary: task.title,
        description: `Tarea de SoulDream: ${task.description || ''}
Prioridad: ${task.priority}
Estado: ${task.status}`,
        startDateTime,
        endDateTime,
        // Asignar color según prioridad
        colorId: task.priority === 'high' ? '4' : (task.priority === 'medium' ? '5' : '9'),
      }
    );
    
    return event;
  } catch (error) {
    console.error('Error al sincronizar tarea con el calendario:', error);
    throw error;
  }
} 
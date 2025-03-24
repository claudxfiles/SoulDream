import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Función para crear un cliente autorizado
async function getGoogleCalendarClient(accessToken: string) {
  const auth = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

/**
 * API general para el calendario
 * Esta API ahora redirige las solicitudes específicas a los endpoints correspondientes
 */

export async function GET(request: NextRequest) {
  try {
    // Obtener la URL completa
    const url = new URL(request.url);
    
    // Determinar el tipo de solicitud por los parámetros
    if (url.searchParams.has('timeMin') && url.searchParams.has('timeMax')) {
      // Es una solicitud de eventos, redireccionar al endpoint especializado
      const newUrl = new URL(url);
      newUrl.pathname = '/api/v1/calendar/events';
      
      console.log(`API Calendar: Redirigiendo solicitud de eventos a ${newUrl.pathname}`);
      
      // Usar redirección interna
      return NextResponse.redirect(newUrl);
    }
    
    // Si no es un tipo de solicitud reconocida, devolver error
    return NextResponse.json(
      { error: 'Solicitud no válida. Especifica el tipo de operación de calendario.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Calendar: Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la API de calendario' },
      { status: 500 }
    );
  }
}

// POST: Crear un evento en el calendario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, description, startDateTime, endDateTime, location, colorId, calendarId = 'primary' } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Se requieren título, fecha de inicio y fecha de fin' },
        { status: 400 }
      );
    }

    // Obtener sesión del usuario desde Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el token de Google del usuario
    const googleToken = session.user.user_metadata.google_token;
    if (!googleToken || !googleToken.access_token) {
      return NextResponse.json(
        { error: 'Usuario no conectado a Google Calendar' },
        { status: 401 }
      );
    }

    // Crear cliente de Calendar e insertar evento
    const calendar = await getGoogleCalendarClient(googleToken.access_token);
    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        location,
        colorId,
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/Madrid', // Zona horaria específica o dinámica según necesidades
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Europe/Madrid', // Zona horaria específica o dinámica según necesidades
        },
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear evento' },
      { status: 500 }
    );
  }
} 
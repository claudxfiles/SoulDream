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

// PATCH: Actualizar un evento del calendario
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const body = await request.json();
    const { summary, description, startDateTime, endDateTime, location, colorId, calendarId = 'primary' } = body;

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

    // Construir el objeto de evento para la actualización
    const eventData: any = {};
    
    if (summary !== undefined) eventData.summary = summary;
    if (description !== undefined) eventData.description = description;
    if (location !== undefined) eventData.location = location;
    if (colorId !== undefined) eventData.colorId = colorId;
    
    if (startDateTime) {
      eventData.start = {
        dateTime: startDateTime,
        timeZone: 'Europe/Madrid',
      };
    }
    
    if (endDateTime) {
      eventData.end = {
        dateTime: endDateTime,
        timeZone: 'Europe/Madrid',
      };
    }

    // Crear cliente de Calendar y actualizar evento
    const calendar = await getGoogleCalendarClient(googleToken.access_token);
    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventData,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error al actualizar evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar evento' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un evento del calendario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId;
    const searchParams = request.nextUrl.searchParams;
    const calendarId = searchParams.get('calendarId') || 'primary';

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

    // Crear cliente de Calendar y eliminar evento
    const calendar = await getGoogleCalendarClient(googleToken.access_token);
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar evento:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar evento' },
      { status: 500 }
    );
  }
} 
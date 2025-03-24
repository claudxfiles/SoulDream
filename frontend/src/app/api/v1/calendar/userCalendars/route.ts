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

// GET: Obtener los calendarios del usuario
export async function GET(request: NextRequest) {
  try {
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

    // Crear cliente de Calendar y obtener lista de calendarios
    const calendar = await getGoogleCalendarClient(googleToken.access_token);
    const response = await calendar.calendarList.list();

    return NextResponse.json(response.data.items || []);
  } catch (error: any) {
    console.error('Error al obtener calendarios del usuario:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener calendarios del usuario' },
      { status: 500 }
    );
  }
} 
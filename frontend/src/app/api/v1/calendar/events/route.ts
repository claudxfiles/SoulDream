import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

/**
 * GET: Obtener eventos del calendario de Google para un rango de fechas específico
 */
export async function GET(request: NextRequest) {
  try {
    console.log('API Calendar Events: Recibida solicitud de eventos');
    
    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const calendarId = searchParams.get('calendarId') || 'primary';

    if (!timeMin || !timeMax) {
      console.error('API Calendar Events: Faltan parámetros timeMin o timeMax');
      return NextResponse.json(
        { error: 'Se requieren parámetros timeMin y timeMax' },
        { status: 400 }
      );
    }

    // Obtener sesión del usuario desde Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('API Calendar Events: No hay sesión de usuario activa');
      return NextResponse.json(
        { error: 'No autorizado - No hay sesión activa' },
        { status: 401 }
      );
    }

    console.log('API Calendar Events: Sesión de usuario encontrada, verificando token de Google');
    
    // Obtener el token de Google del usuario
    const googleToken = session.user.user_metadata?.google_token;
    
    // Log detallado del token para diagnóstico
    console.log('API Calendar Events: Analizando token de Google del usuario:', JSON.stringify({
      hasMetadata: !!session.user.user_metadata,
      metadataKeys: session.user.user_metadata ? Object.keys(session.user.user_metadata) : [],
      hasGoogleToken: !!googleToken,
      tokenDetails: googleToken ? {
        hasAccessToken: !!googleToken.access_token,
        accessTokenLength: googleToken.access_token ? googleToken.access_token.length : 0,
        hasRefreshToken: !!googleToken.refresh_token,
        refreshTokenLength: googleToken.refresh_token ? googleToken.refresh_token.length : 0,
        expiresAt: googleToken.expires_at ? new Date(googleToken.expires_at * 1000).toISOString() : 'N/A',
        scope: googleToken.scope || 'N/A'
      } : 'No token'
    }));
    
    if (!googleToken || !googleToken.access_token) {
      console.error('API Calendar Events: Usuario no tiene token de Google válido');
      return NextResponse.json(
        { error: 'Usuario no conectado a Google Calendar o token inválido', needsReconnect: true },
        { status: 401 }
      );
    }

    // Verificar si el token ha expirado
    if (googleToken.expires_at && googleToken.expires_at < Date.now() / 1000) {
      console.error('API Calendar Events: Token de Google expirado', {
        expiresAt: new Date(googleToken.expires_at * 1000).toISOString(),
        now: new Date().toISOString()
      });
      
      // Si hay refresh_token, intentar refrescarlo automáticamente
      if (googleToken.refresh_token) {
        try {
          console.log('API Calendar Events: Intentando refrescar token automáticamente');
          
          // Llamar a la función Edge de Supabase para refrescar el token
          const { data: refreshData, error: refreshError } = await supabase.functions.invoke('refresh-google-token', {
            body: { refresh_token: googleToken.refresh_token }
          });
          
          if (refreshError || !refreshData) {
            throw new Error(`Error refrescando token: ${refreshError?.message || 'Respuesta vacía'}`);
          }
          
          // Actualizar token en los metadatos del usuario
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              google_token: {
                access_token: refreshData.access_token,
                refresh_token: googleToken.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
                token_type: refreshData.token_type || 'Bearer',
                scope: googleToken.scope
              }
            }
          });
          
          if (updateError) {
            throw new Error(`Error actualizando token: ${updateError.message}`);
          }
          
          console.log('API Calendar Events: Token refrescado exitosamente, continuando con la solicitud');
          
          // Usar el nuevo token para la solicitud a Google Calendar
          const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          
          oauth2Client.setCredentials({
            access_token: refreshData.access_token
          });
          
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          
          const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          });
          
          console.log(`API Calendar Events: Eventos obtenidos exitosamente (${response.data.items?.length || 0} eventos)`);
          return NextResponse.json(response.data.items || []);
        } catch (refreshError) {
          console.error('API Calendar Events: Error al refrescar token automáticamente:', refreshError);
          return NextResponse.json(
            { 
              error: 'Token expirado y no se pudo refrescar automáticamente.', 
              needsReconnect: true,
              details: refreshError instanceof Error ? refreshError.message : 'Error desconocido'
            },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'Token de Google Calendar expirado y no hay refresh token.', 
            needsReconnect: true 
          },
          { status: 401 }
        );
      }
    }

    console.log('API Calendar Events: Token válido, obteniendo eventos con scopes:', googleToken.scope);

    // Crear cliente de Google Calendar
    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: googleToken.access_token
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      console.log(`API Calendar Events: Eventos obtenidos exitosamente (${response.data.items?.length || 0} eventos)`);
      return NextResponse.json(response.data.items || []);
    } catch (googleError: any) {
      // Logging detallado del error
      console.error('API Calendar Events: Error de Google Calendar API:', {
        message: googleError?.message,
        status: googleError?.response?.status,
        statusText: googleError?.response?.statusText,
        data: googleError?.response?.data,
        requiredScopes: googleError?.response?.data?.error?.details,
        headers: googleError?.config?.headers,
      });
      
      // Verificar si es un error de permisos o autenticación
      if (googleError?.response?.status === 403) {
        console.log('API Calendar Events: Error 403 detectado - Problema de permisos');
        
        // Verificar si el error está relacionado con scopes insuficientes
        const errorDetails = googleError?.response?.data?.error?.message || '';
        const insufficientScopes = errorDetails.includes('insufficient authentication scopes');
        
        if (insufficientScopes) {
          console.log('API Calendar Events: Se requiere reconexión con permisos adicionales');
          return NextResponse.json(
            { 
              error: 'Problema de permisos con Google Calendar (Error 403)', 
              details: errorDetails,
              needsReconnect: true,
              forceConsent: true, // Indicar que se debe forzar el consentimiento para obtener nuevos permisos
              errorCode: 'INSUFFICIENT_SCOPES'
            },
            { status: 403 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Problema de permisos con Google Calendar (Error 403)', 
            details: errorDetails,
            needsReconnect: true,
            errorCode: 'PERMISSION_DENIED'
          },
          { status: 403 }
        );
      }
      
      // Verificar si es un error de autenticación
      if (googleError?.response?.status === 401) {
        return NextResponse.json(
          { 
            error: 'Token de acceso a Google Calendar inválido o expirado (Error 401)',
            needsReconnect: true,
            errorCode: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      }
      
      // Otros errores de Google Calendar
      return NextResponse.json(
        { 
          error: `Error al comunicarse con Google Calendar: ${googleError?.message || 'Error desconocido'}`,
          details: googleError?.response?.data?.error?.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API Calendar Events: Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener eventos de calendario' },
      { status: 500 }
    );
  }
} 
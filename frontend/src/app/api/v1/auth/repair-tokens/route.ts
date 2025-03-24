import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para reparar tokens de Google cuando hay problemas de autorización
 * Este endpoint intentará:
 * 1. Limpiar los tokens actuales
 * 2. Actualizar los metadatos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener el ID de usuario de los parámetros
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      );
    }

    // Inicializar cliente de Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar la sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No hay sesión activa' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario solicitado es el mismo que está autenticado
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para modificar este usuario' },
        { status: 403 }
      );
    }
    
    console.log('API repair-tokens: Intentando reparar tokens para el usuario', userId);
    
    // Obtener metadatos actuales del usuario
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json(
        { error: `Error obteniendo usuario: ${userError.message}` },
        { status: 500 }
      );
    }
    
    // Verificar tokens existentes
    const googleToken = userData.user?.user_metadata?.google_token;
    
    console.log('API repair-tokens: Tokens actuales:', JSON.stringify({
      hasToken: !!googleToken,
      tokenDetails: googleToken ? {
        hasAccessToken: !!googleToken.access_token,
        hasRefreshToken: !!googleToken.refresh_token,
        expiresAt: googleToken.expires_at ? new Date(googleToken.expires_at * 1000).toISOString() : 'N/A'
      } : 'No hay tokens'
    }));
    
    // Comprobar si hay un refresh_token 
    if (!googleToken || !googleToken.refresh_token) {
      console.log('API repair-tokens: No hay refresh_token disponible, se necesita reconexión completa');
      
      // Generar URL para reconexión
      const reconnectUrl = `/auth/reconnect?source=calendar_repair&userId=${userId}`;
      
      return NextResponse.json({
        success: false,
        needsFullReconnect: true,
        reconnectUrl,
        message: 'Se requiere reconexión completa con Google'
      });
    }
    
    // Si tenemos un refresh_token, intentar actualizar el token de acceso
    try {
      // Llamar a la función que refresca el token (esto normalmente sería un endpoint separado)
      const { data: refreshData, error: refreshError } = await supabase.functions.invoke('refresh-google-token', {
        body: { 
          refresh_token: googleToken.refresh_token 
        }
      });
      
      if (refreshError || !refreshData) {
        throw new Error(`Error al refrescar token: ${refreshError?.message || 'Respuesta vacía'}`);
      }
      
      // Actualizar el token en los metadatos del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          google_token: {
            access_token: refreshData.access_token,
            refresh_token: googleToken.refresh_token, // Mantener el refresh_token existente
            expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
            token_type: refreshData.token_type || 'Bearer',
            scope: googleToken.scope // Mantener el scope existente
          }
        }
      });
      
      if (updateError) {
        throw new Error(`Error al actualizar metadatos: ${updateError.message}`);
      }
      
      console.log('API repair-tokens: Tokens reparados exitosamente');
      
      return NextResponse.json({
        success: true,
        message: 'Tokens reparados exitosamente'
      });
    } catch (error) {
      console.error('API repair-tokens: Error al refrescar tokens:', error);
      
      // Si hay un error al refrescar, recomendar reconexión completa
      return NextResponse.json({
        success: false,
        needsFullReconnect: true,
        reconnectUrl: `/auth/reconnect?source=calendar_repair&userId=${userId}`,
        message: error instanceof Error ? error.message : 'Error desconocido al reparar tokens',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API repair-tokens: Error general:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 
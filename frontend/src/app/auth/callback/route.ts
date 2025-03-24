import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const source = requestUrl.searchParams.get('source');
  const timestamp = requestUrl.searchParams.get('t');
  const action = requestUrl.searchParams.get('action');
  
  // Manejar acción de reconexión forzada
  if (action === 'force_reconnect') {
    console.log('⚠️ Iniciando proceso de reconexión forzada...');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Sesión encontrada, iniciando reconexión para:', session.user.email);
        
        // Primero intentar limpiar la metadata actual
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            google_token: null
          }
        });
        
        if (updateError) {
          console.error('Error al limpiar metadata:', updateError);
        } else {
          console.log('✅ Metadata limpiada correctamente');
        }
        
        // Iniciar nuevo flujo de OAuth
        return NextResponse.redirect(new URL(`${requestUrl.origin}/auth/login?provider=google&prompt=select_account&t=${Date.now()}`, request.url));
      } else {
        console.log('No se encontró sesión activa, redirigiendo a login...');
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } catch (error) {
      console.error('Error en reconexión forzada:', error);
      return NextResponse.redirect(new URL('/auth/error?message=Error+en+reconexión+forzada', request.url));
    }
  }
  
  console.log(`Callback recibido con código de autenticación${source ? ` (fuente: ${source})` : ''}${timestamp ? ` (timestamp: ${timestamp})` : ''}`);
  
  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      // Intercambiar el código por una sesión
      console.log('Intercambiando código por sesión...');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error al intercambiar código por sesión:', error);
        return NextResponse.redirect(new URL(`/auth/error?message=Error+al+procesar+autenticación&error=${encodeURIComponent(error.message)}`, request.url));
      }
      
      console.log('Sesión obtenida correctamente');
      
      if (data?.session?.user) {
        console.log('Usuario autenticado:', data.session.user.email);
        console.log('Provider:', data.session.user.app_metadata?.provider);
        console.log('User metadata keys:', Object.keys(data.session.user.user_metadata || {}));
        
        // Comprobar si es autenticación de Google
        if (data.session.user.app_metadata?.provider === 'google') {
          console.log('📝 Comprobando tokens en la sesión...');
          
          // Verificar tokens en la sesión (tienen prioridad)
          const providerToken = data.session.provider_token;
          const providerRefreshToken = data.session.provider_refresh_token;
          
          console.log('Provider token disponible:', !!providerToken);
          console.log('Provider refresh token disponible:', !!providerRefreshToken);
          
          if (providerToken) {
            console.log('✅ Se encontró provider_token en la sesión');
            
            // Intentar actualizar el user_metadata con los tokens de Google
            try {
              console.log('Intentando actualizar user_metadata con los tokens de Google...');
              
              // Crear un objeto con los tokens y la información necesaria
              const tokenData = {
                access_token: providerToken,
                refresh_token: providerRefreshToken,
                expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hora de expiración por defecto
                scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
              };
              
              // Actualizar el metadata del usuario
              const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                data: {
                  google_token: tokenData
                }
              });
              
              if (updateError) {
                console.error('❌ Error al actualizar user_metadata:', updateError);
              } else {
                console.log('✅ User metadata actualizado correctamente con tokens de Google');
                
                // Verificar que los datos se actualizaron correctamente
                const { data: userData } = await supabase.auth.getUser();
                const updatedGoogleToken = userData?.user?.user_metadata?.google_token;
                
                console.log('Token actualizado:', {
                  success: !!updatedGoogleToken,
                  hasAccessToken: !!updatedGoogleToken?.access_token,
                  accessTokenLength: updatedGoogleToken?.access_token?.length || 0
                });
                
                // Si no se actualizó correctamente, intentar un enfoque alternativo
                if (!updatedGoogleToken?.access_token) {
                  console.log('⚠️ El token no se actualizó correctamente, intentando método alternativo...');
                  
                  // Intentar actualizar con un RPC directo (puede requerir configuración adicional)
                  try {
                    await supabase.rpc('store_google_token', {
                      access_token: providerToken, 
                      refresh_token: providerRefreshToken
                    });
                    console.log('✅ Token actualizado mediante RPC');
                  } catch (rpcError) {
                    console.error('❌ Error al actualizar mediante RPC:', rpcError);
                  }
                }
              }
            } catch (updateError) {
              console.error('❌ Error al intentar actualizar tokens:', updateError);
            }
          } else {
            console.log('❌ No se encontró provider_token en la sesión');
            
            // Verificar si tenemos tokens en el metadata (opción de respaldo)
            const googleToken = data.session.user.user_metadata?.google_token;
            
            if (googleToken?.access_token) {
              console.log('✅ Tokens de Google encontrados en user_metadata', {
                hasAccessToken: true,
                accessTokenLength: googleToken.access_token.length,
                hasRefreshToken: !!googleToken.refresh_token,
                expiresAt: googleToken.expires_at ? new Date(googleToken.expires_at * 1000).toISOString() : 'No disponible'
              });
            } else {
              console.error('❌ No se encontraron tokens de Google en ningún lugar');
              
              // Si viene de un intento de conectar con calendar, esto es un problema
              if (source === 'calendar') {
                console.error('📅 Error: Solicitud específica de calendario pero no se obtuvieron tokens');
                
                // Redireccionar a una página de error específica
                return NextResponse.redirect(new URL('/auth/error?message=No+se+pudieron+obtener+tokens+de+Google&origin=calendar', request.url));
              }
            }
          }
        } else {
          console.log('La autenticación no es de Google, es de:', data.session.user.app_metadata?.provider);
        }
      }
      
      // Redirección específica para solicitudes de calendario
      if (source === 'calendar') {
        console.log('Redirigiendo al usuario al dashboard/calendar después de autenticación de calendario');
        return NextResponse.redirect(new URL('/dashboard/calendar', request.url));
      }
    } catch (err) {
      console.error('Error en el proceso de callback:', err);
      return NextResponse.redirect(new URL('/auth/error?message=Error+inesperado', request.url));
    }
  } else {
    console.error('No se recibió código de autenticación');
    return NextResponse.redirect(new URL('/auth/error?message=No+se+recibió+código', request.url));
  }

  // Redirigir al usuario al dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const timestamp = requestUrl.searchParams.get('t') || Date.now().toString();
  
  try {
    console.log('⚠️ API: Iniciando proceso de reconexión forzada para Google Calendar...');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Obtener sesión actual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No hay sesión activa');
      return NextResponse.json({ 
        error: 'No hay sesión activa',
        redirect: '/auth/login'
      }, { status: 401 });
    }
    
    console.log('Sesión encontrada, iniciando reconexión para:', session.user.email);
    
    // Primero limpiar los tokens actuales de Google
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        google_token: null
      }
    });
    
    if (updateError) {
      console.error('Error al limpiar tokens:', updateError);
      return NextResponse.json({ 
        error: 'Error al limpiar tokens',
        details: updateError.message
      }, { status: 500 });
    }
    
    console.log('✅ Tokens limpiados correctamente');
    
    // Iniciar nuevo flujo de OAuth con Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${requestUrl.origin}/auth/callback?source=calendar&t=${timestamp}`,
        scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',  // Forzar consentimiento y selección de cuenta
          include_granted_scopes: 'true',
        },
      }
    });
    
    if (error) {
      console.error('Error al iniciar OAuth con Google:', error);
      return NextResponse.json({ 
        error: 'Error al iniciar OAuth con Google',
        details: error.message
      }, { status: 500 });
    }
    
    // Si llegamos aquí, el proceso se ha iniciado correctamente
    console.log('✅ Proceso de OAuth iniciado correctamente');
    return NextResponse.json({ 
      success: true,
      message: 'Redirección a Google iniciada correctamente'
    });
    
  } catch (error: any) {
    console.error('Error en proceso de reconexión:', error);
    return NextResponse.json({ 
      error: 'Error en proceso de reconexión',
      details: error.message
    }, { status: 500 });
  }
} 
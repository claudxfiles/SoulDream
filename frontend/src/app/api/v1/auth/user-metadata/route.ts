import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cliente de Supabase con service_role para acceso administrativo
// Esto permite bypassear RLS y acceder directamente a los datos del usuario
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Validar que se proporcionó un userId
    if (!userId) {
      return NextResponse.json({ error: 'Se requiere userId' }, { status: 400 });
    }
    
    console.log('Obteniendo metadatos para usuario:', userId);
    
    // Obtener el usuario de Supabase usando service_role para bypassear RLS
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error('Error al obtener usuario:', userError);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Extraer solo los metadatos necesarios
    const { google_token } = userData.user.user_metadata || {};
    
    // Obtener también credenciales de la tabla user_integrations
    const { data: integrationData, error: integrationError } = await supabaseAdmin
      .from('user_integrations')
      .select('credentials')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .maybeSingle();
      
    if (integrationError) {
      console.warn('Error al obtener integración:', integrationError);
    }
    
    // Priorizar las credenciales de integrations sobre metadatos si existen ambas
    const credentials = integrationData?.credentials || google_token;
    
    return NextResponse.json({ 
      google_token: credentials
    });
    
  } catch (error: any) {
    console.error('Error al obtener metadatos de usuario:', error);
    return NextResponse.json({ 
      error: 'Error al obtener metadatos', 
      details: error.message 
    }, { status: 500 });
  }
} 
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Forzar HTTPS en producción
  if (process.env.NODE_ENV === 'production' && req.url.startsWith('http://')) {
    const url = new URL(req.url);
    url.protocol = 'https:';
    console.log('Redirigiendo a HTTPS:', url.toString());
    return NextResponse.redirect(url);
  }

  // 2. Configurar cliente de Supabase
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // 3. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();

    // 4. Definir rutas públicas
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/callback',
      '/auth/reconnect',
      '/api/v1/auth',
    ];
    
    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    );
    
    // 5. Si el usuario no está autenticado y está intentando acceder a una ruta protegida
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 6. Si el usuario está autenticado y está intentando acceder a una ruta de autenticación
    if (session && (req.nextUrl.pathname === '/auth/login' || req.nextUrl.pathname === '/auth/register')) {
      const redirectUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // 7. Permitir acceso a rutas específicas sin verificación adicional
    if (req.nextUrl.pathname === '/auth/reconnect' || 
        req.nextUrl.pathname === '/dashboard/profile/subscription') {
      // Evitar bucle de redirección para la página de suscripción
      return res;
    }

    // Verificar si estamos en la página de suscripción con parámetro success
    if (req.nextUrl.pathname === '/dashboard/profile/subscription' && 
        req.nextUrl.searchParams.get('success') === 'true') {
      // Permitir acceso sin verificar suscripción para evitar bucles
      return res;
    }

    // 8. Verificar suscripción para rutas del dashboard (excepto la página de suscripción)
    if (session && req.nextUrl.pathname.startsWith('/dashboard') && 
        !req.nextUrl.pathname.includes('/profile/subscription')) {
      
      // Combinar ambos enfoques de verificación de suscripción
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, trial_ends_at, current_period_ends_at, plan_type, cancel_at_period_end')
        .eq('user_id', session.user.id)
        .single();

      const now = new Date();
      
      // Función helper para comparar fechas considerando zonas horarias
      const isDateValid = (date: string | null) => {
        if (!date) return false;
        return new Date(date) > now;
      };

      const hasValidSubscription = subscription && (
        // Suscripción activa (no cancelada al final del período)
        (subscription.status === 'active' && !subscription.cancel_at_period_end) ||
        
        // Suscripción activa pero cancelada al final del período
        (subscription.status === 'active' && 
         subscription.cancel_at_period_end && 
         isDateValid(subscription.current_period_ends_at)) ||
        
        // En período de prueba
        (subscription.status === 'active' && 
         subscription.trial_ends_at && 
         isDateValid(subscription.trial_ends_at)) ||
        
        // Suscripción suspendida pero aún en período pagado
        (subscription.status === 'suspended' && 
         isDateValid(subscription.current_period_ends_at))
      );

      // Si no tiene suscripción válida, redirigir a la página de suscripción
      if (!hasValidSubscription) {
        console.log('Suscripción inválida:', {
          status: subscription?.status,
          trial_ends_at: subscription?.trial_ends_at,
          current_period_ends_at: subscription?.current_period_ends_at,
          cancel_at_period_end: subscription?.cancel_at_period_end
        });
        
        // Evitamos redirecciones en bucle verificando si ya estamos en la ruta de destino
        const subscriptionUrl = new URL('/dashboard/profile/subscription', req.url);
        if (req.nextUrl.pathname !== subscriptionUrl.pathname) {
          return NextResponse.redirect(subscriptionUrl);
        }
      }
    }

    return res;
  } catch (error) {
    console.error('Error en middleware:', error);
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
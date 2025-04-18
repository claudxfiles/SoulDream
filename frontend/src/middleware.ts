import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // 1. Forzar HTTPS en producción
  if (process.env.NODE_ENV === 'production') {
    if (req.url.startsWith('http://')) {
      const url = new URL(req.url);
      url.protocol = 'https:';
      console.log('Redirigiendo a HTTPS:', url.toString());
      return NextResponse.redirect(url);
    }
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
    
    // 7. Permitir acceso a la ruta de reconexión de calendario incluso si el usuario está autenticado
    if (req.nextUrl.pathname === '/auth/reconnect') {
      return res;
    }

    // 8. Verificar suscripción para rutas del dashboard (excepto la página de suscripción)
    if (session && 
        req.nextUrl.pathname.startsWith('/dashboard') && 
        !req.nextUrl.pathname.includes('/profile/subscription')) {
      
      // Verificar suscripción considerando período de prueba y fechas de validez
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, trial_end, current_period_end')
        .eq('user_id', session.user.id)
        .single();

      const now = new Date();
      const hasValidSubscription = subscription && (
        subscription.status === 'active' ||
        (subscription.status === 'trialing' && new Date(subscription.trial_end) > now) ||
        (subscription.status === 'cancelled' && new Date(subscription.current_period_end) > now)
      );

      // Si no tiene suscripción válida, redirigir a la página de suscripción
      if (!hasValidSubscription) {
        return NextResponse.redirect(
          new URL('/dashboard/profile/subscription', req.url)
        );
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
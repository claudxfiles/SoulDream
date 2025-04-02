export const dynamic = 'force-dynamic';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Feature {
  name: string;
  included: boolean;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No hay sesión activa');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Session encontrada:', session.user.id);

    // Primero verificamos si el usuario existe en la tabla de profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener el perfil:', profileError);
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      );
    }

    // Luego buscamos la suscripción
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          price,
          name,
          interval,
          currency,
          features
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError) {
      console.error('Error al obtener la suscripción:', subscriptionError);
      return NextResponse.json(
        { error: 'Error al obtener la suscripción' },
        { status: 500 }
      );
    }

    // Si no hay suscripción, devolvemos un plan por defecto
    if (!subscription) {
      return NextResponse.json({
        plan_value: 0,
        member_since: profile.created_at,
        plan_type: 'Free',
        plan_interval: 'month',
        plan_currency: 'USD',
        plan_status: 'active',
        subscription_date: profile.created_at,
        plan_validity_end: null,
        plan_features: ['Acceso básico']
      });
    }

    // Procesamos los features para asegurarnos de que sean strings
    const features = subscription.subscription_plans?.features || [];
    const processedFeatures = Array.isArray(features) 
      ? features.map((feature: Feature | string) => {
          if (typeof feature === 'string') return feature;
          return feature.name;
        })
      : ['Acceso básico'];

    // Formateamos la respuesta
    const response = {
      plan_value: subscription.subscription_plans?.price || 0,
      member_since: profile.created_at,
      plan_type: subscription.subscription_plans?.name || 'Free',
      plan_interval: subscription.subscription_plans?.interval || 'month',
      plan_currency: subscription.subscription_plans?.currency || 'USD',
      plan_status: subscription.status || 'active',
      subscription_date: subscription.created_at,
      plan_validity_end: subscription.current_period_ends_at,
      plan_features: processedFeatures
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error en la ruta de suscripción:', error);
    return NextResponse.json(
      { error: 'Error al obtener la información de suscripción' },
      { status: 500 }
    );
  }
} 
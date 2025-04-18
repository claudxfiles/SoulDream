export const dynamic = 'force-dynamic';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Subscription } from '@/types/subscription';

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

    // Buscamos la suscripción activa del usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          price,
          interval,
          currency,
          features
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error al obtener la suscripción:', subscriptionError);
      return NextResponse.json(
        { error: 'Error al obtener la suscripción' },
        { status: 500 }
      );
    }

    // Si no hay suscripción o hay error de "no encontrado", devolvemos una suscripción gratuita
    if (!subscription || subscriptionError?.code === 'PGRST116') {
      const freePlan: Subscription = {
        id: 'free',
        user_id: session.user.id,
        paypal_subscription_id: null,
        plan_type: 'Free',
        plan_interval: 'monthly',
        plan_currency: 'USD',
        plan_value: 0,
        plan_features: ['Acceso básico'],
        status: 'expired',
        payment_method: 'none',
        current_period_starts_at: new Date().toISOString(),
        current_period_ends_at: new Date().toISOString(),
        trial_ends_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancel_at_period_end: false,
        metadata: {}
      };
      return NextResponse.json(freePlan);
    }

    // Procesamos los features
    let planFeatures = ['Acceso básico'];
    if (subscription.metadata?.features) {
      planFeatures = subscription.metadata.features;
    } else if (subscription.subscription_plans?.features) {
      planFeatures = Array.isArray(subscription.subscription_plans.features)
        ? subscription.subscription_plans.features.map((feature: Feature | string) => {
            if (typeof feature === 'string') return feature;
            return feature.name;
          })
        : ['Acceso básico'];
    }

    // Formateamos la respuesta según el tipo Subscription
    const response: Subscription = {
      id: subscription.id,
      user_id: subscription.user_id,
      paypal_subscription_id: subscription.paypal_subscription_id,
      plan_type: subscription.plan_type || subscription.subscription_plans?.name || 'Unknown',
      plan_interval: subscription.subscription_plans?.interval || 'monthly',
      plan_currency: subscription.subscription_plans?.currency || 'USD',
      plan_value: subscription.subscription_plans?.price || 0,
      plan_features: planFeatures,
      status: subscription.status,
      payment_method: 'PayPal',
      current_period_starts_at: subscription.current_period_starts_at,
      current_period_ends_at: subscription.current_period_ends_at,
      trial_ends_at: subscription.trial_ends_at,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      metadata: subscription.metadata || {}
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
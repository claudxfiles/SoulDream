import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { subscriptionId, reason } = await request.json();

    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que la suscripción pertenece al usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Cancelar suscripción en PayPal
    const response = await fetch(
      `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          reason: reason || 'Cancelled by user'
        }),
      }
    );

    if (!response.ok) {
      const paypalError = await response.json();
      throw new Error(paypalError.message || 'Error al cancelar la suscripción en PayPal');
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_at_period_end: true,
        cancellation_reason: reason || 'Cancelled by user'
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error('Error al actualizar el estado de la suscripción');
    }

    // Registrar el evento de cancelación
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'subscription_cancelled',
        metadata: {
          cancelled_at: new Date().toISOString(),
          reason: reason || 'Cancelled by user',
          paypal_subscription_id: subscriptionId
        }
      });

    if (eventError) {
      console.error('Error al registrar evento de cancelación:', eventError);
    }

    // Actualizar el nivel de suscripción del usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', session.user.id);

    if (profileError) {
      console.error('Error al actualizar el nivel de suscripción:', profileError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en la cancelación de suscripción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la cancelación' },
      { status: 500 }
    );
  }
} 
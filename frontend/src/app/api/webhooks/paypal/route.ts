import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const eventType = payload.event_type;
    const resourceId = payload.resource.id;

    const supabase = createRouteHandlerClient({ cookies });

    // Verificar la autenticidad del webhook (implementar verificación de firma PayPal)
    // TODO: Implementar verificación de webhook

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // La suscripción ha sido cancelada en PayPal
        await handleSubscriptionCancelled(supabase, resourceId);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // La suscripción ha expirado
        await handleSubscriptionExpired(supabase, resourceId);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // La suscripción ha sido suspendida (ej: pago fallido)
        await handleSubscriptionSuspended(supabase, resourceId);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // El pago de la suscripción ha fallado
        await handlePaymentFailed(supabase, resourceId);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook de PayPal:', error);
    return NextResponse.json(
      { error: 'Error procesando webhook' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCancelled(supabase: any, subscriptionId: string) {
  const now = new Date().toISOString();

  // Actualizar el estado de la suscripción
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: now,
    })
    .eq('subscription_id', subscriptionId);

  // Registrar el evento
  await supabase
    .from('subscription_events')
    .insert({
      subscription_id: subscriptionId,
      event_type: 'subscription_cancelled',
      metadata: {
        cancelled_at: now,
      },
    });
}

async function handleSubscriptionExpired(supabase: any, subscriptionId: string) {
  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({
      status: 'expired',
      expired_at: now,
    })
    .eq('subscription_id', subscriptionId);

  await supabase
    .from('subscription_events')
    .insert({
      subscription_id: subscriptionId,
      event_type: 'subscription_expired',
      metadata: {
        expired_at: now,
      },
    });
}

async function handleSubscriptionSuspended(supabase: any, subscriptionId: string) {
  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({
      status: 'suspended',
      suspended_at: now,
    })
    .eq('subscription_id', subscriptionId);

  await supabase
    .from('subscription_events')
    .insert({
      subscription_id: subscriptionId,
      event_type: 'subscription_suspended',
      metadata: {
        suspended_at: now,
      },
    });
}

async function handlePaymentFailed(supabase: any, subscriptionId: string) {
  const now = new Date().toISOString();

  await supabase
    .from('subscription_events')
    .insert({
      subscription_id: subscriptionId,
      event_type: 'payment_failed',
      metadata: {
        failed_at: now,
      },
    });
} 
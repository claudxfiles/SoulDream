import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Función para verificar la firma del webhook de PayPal
function verifyPayPalWebhookSignature(
  body: string,
  headers: Headers,
  webhookId: string
): boolean {
  try {
    const transmissionId = headers.get('paypal-transmission-id');
    const timestamp = headers.get('paypal-transmission-time');
    const webhookEvent = headers.get('paypal-transmission-sig');
    const certUrl = headers.get('paypal-cert-url');

    if (!transmissionId || !timestamp || !webhookEvent || !certUrl) {
      console.error('Missing required PayPal webhook headers');
      return false;
    }

    // Construir la cadena de verificación
    const data = `${webhookId}|${transmissionId}|${timestamp}|${body}`;
    
    // En un entorno de producción, aquí deberías:
    // 1. Descargar el certificado de PayPal desde certUrl
    // 2. Verificar que el certificado es válido y de PayPal
    // 3. Usar el certificado para verificar la firma

    // Por ahora, retornamos true en desarrollo
    // TODO: Implementar verificación completa en producción
    return process.env.NODE_ENV === 'development' || process.env.SKIP_WEBHOOK_VERIFICATION === 'true';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body);
    const eventType = payload.event_type;
    const resourceId = payload.resource.id;

    // Verificar la firma del webhook
    const isValid = verifyPayPalWebhookSignature(
      body,
      request.headers,
      process.env.PAYPAL_WEBHOOK_ID || ''
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabase, resourceId, payload.resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(supabase, resourceId, payload.resource);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(supabase, resourceId, payload.resource);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(supabase, resourceId, payload.resource);
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

async function handleSubscriptionCancelled(supabase: any, subscriptionId: string, resource: any) {
  const now = new Date().toISOString();

  try {
    // 1. Obtener la suscripción actual
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscriptionError || !subscription) {
      console.error('Subscription not found:', subscriptionError);
      return;
    }

    // 2. Actualizar el estado de la suscripción
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancel_at_period_end: true,
        cancellation_reason: resource.status_update_reason || 'Cancelled via PayPal'
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }

    // 3. Registrar el evento
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'subscription_cancelled',
        metadata: {
          cancelled_at: now,
          reason: resource.status_update_reason || 'Cancelled via PayPal',
          paypal_data: resource
        }
      });

    // 4. Actualizar el nivel de suscripción del usuario
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', subscription.user_id);

  } catch (error) {
    console.error('Error handling subscription cancelled webhook:', error);
  }
}

async function handleSubscriptionExpired(supabase: any, subscriptionId: string, resource: any) {
  const now = new Date().toISOString();

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (!subscription) return;

    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        expired_at: now
      })
      .eq('id', subscription.id);

    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'subscription_expired',
        metadata: {
          expired_at: now,
          paypal_data: resource
        }
      });

    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', subscription.user_id);
  } catch (error) {
    console.error('Error handling subscription expired webhook:', error);
  }
}

async function handleSubscriptionSuspended(supabase: any, subscriptionId: string, resource: any) {
  const now = new Date().toISOString();

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (!subscription) return;

    await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        suspended_at: now
      })
      .eq('id', subscription.id);

    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'subscription_suspended',
        metadata: {
          suspended_at: now,
          reason: resource.status_update_reason,
          paypal_data: resource
        }
      });
  } catch (error) {
    console.error('Error handling subscription suspended webhook:', error);
  }
}

async function handlePaymentFailed(supabase: any, subscriptionId: string, resource: any) {
  const now = new Date().toISOString();

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (!subscription) return;

    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'payment_failed',
        metadata: {
          failed_at: now,
          reason: resource.status_update_reason,
          paypal_data: resource
        }
      });
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
} 
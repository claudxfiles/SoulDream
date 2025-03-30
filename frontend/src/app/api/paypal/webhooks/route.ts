import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const PAYPAL_API_URL = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Crear un cliente de Supabase con las claves de servicio para operaciones de webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(headers: Headers, body: any) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    }),
  });

  const data = await response.json();
  return data.verification_status === 'SUCCESS';
}

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const body = await request.json();

    // Verificar la firma del webhook
    const isValid = await verifyWebhookSignature(headersList, body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = body;
    const eventType = event.event_type;
    const resource = event.resource;

    console.log('Processing PayPal webhook:', eventType);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource);
        break;
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource);
        break;
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(resource);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(resource);
        break;
      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSubscriptionActivated(resource: any) {
  const subscriptionId = resource.id;
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(resource.start_time).toISOString(),
        current_period_end: new Date(resource.billing_info.next_billing_time).toISOString(),
      })
      .eq('id', subscription.id);

    // Actualizar el perfil del usuario
    await supabase
      .from('profiles')
      .update({
        is_subscribed: true,
        subscription_id: subscription.id,
      })
      .eq('id', subscription.user_id);
  }
}

async function handleSubscriptionExpired(resource: any) {
  const subscriptionId = resource.id;
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
      })
      .eq('id', subscription.id);

    // Actualizar el perfil del usuario
    await supabase
      .from('profiles')
      .update({
        is_subscribed: false,
        subscription_id: null,
      })
      .eq('id', subscription.user_id);
  }
}

async function handleSubscriptionCancelled(resource: any) {
  const subscriptionId = resource.id;
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Actualizar el perfil del usuario
    await supabase
      .from('profiles')
      .update({
        is_subscribed: false,
        subscription_id: null,
      })
      .eq('id', subscription.user_id);
  }
}

async function handlePaymentFailed(resource: any) {
  const subscriptionId = resource.id;
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    // Registrar el intento de pago fallido
    await supabase
      .from('payment_history')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        payment_id: resource.id,
        amount: resource.amount.value,
        currency: resource.amount.currency_code,
        status: 'failed',
        payment_method: 'paypal',
        details: resource,
      });
  }
}

async function handlePaymentCompleted(resource: any) {
  const subscriptionId = resource.billing_agreement_id;
  if (!subscriptionId) return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paypal_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    // Registrar el pago exitoso
    await supabase
      .from('payment_history')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        payment_id: resource.id,
        amount: resource.amount.total,
        currency: resource.amount.currency,
        status: 'completed',
        payment_method: 'paypal',
        details: resource,
      });

    // Actualizar la fecha del próximo período si está disponible
    if (resource.billing_info?.next_billing_time) {
      await supabase
        .from('subscriptions')
        .update({
          current_period_end: new Date(resource.billing_info.next_billing_time).toISOString(),
        })
        .eq('id', subscription.id);
    }
  }
} 
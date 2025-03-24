import { NextResponse } from 'next/server';
import { createClientComponent } from '@/lib/supabase';

// Configuración de PayPal
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Función para verificar la autenticidad del webhook
async function verifyWebhookSignature(req: Request, webhookId: string) {
  const body = await req.text();
  const bodyObj = JSON.parse(body);
  
  // Obtener headers necesarios para la verificación
  const headers = new Headers(req.headers);
  const transmissionId = headers.get('paypal-transmission-id');
  const timestamp = headers.get('paypal-transmission-time');
  const signature = headers.get('paypal-transmission-sig');
  const certUrl = headers.get('paypal-cert-url');
  
  if (!transmissionId || !timestamp || !signature || !certUrl) {
    return { verified: false, body: bodyObj };
  }
  
  // Obtener token de acceso para la verificación
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    return { verified: false, body: bodyObj };
  }
  
  // Verificar la firma del webhook
  const verifyResponse = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: timestamp,
      cert_url: certUrl,
      auth_algo: headers.get('paypal-auth-algo'),
      transmission_sig: signature,
      webhook_id: webhookId,
      webhook_event: bodyObj,
    }),
  });
  
  const verifyData = await verifyResponse.json();
  
  return {
    verified: verifyData.verification_status === 'SUCCESS',
    body: bodyObj,
  };
}

// Procesar evento de suscripción creada
async function handleSubscriptionCreated(event: any) {
  const supabase = createClientComponent();
  const subscription = event.resource;
  
  if (!subscription || !subscription.id) {
    console.error('Evento de suscripción sin ID');
    return false;
  }
  
  // Buscar la suscripción en nuestra base de datos
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('subscription_id', subscription.id)
    .single();
    
  if (error || !data) {
    console.error('Suscripción no encontrada:', error);
    return false;
  }
  
  // Actualizar estado de la suscripción
  const now = new Date();
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: subscription.billing_info?.next_billing_time || undefined,
      updated_at: now.toISOString(),
    })
    .eq('id', data.id);
  
  if (updateError) {
    console.error('Error al actualizar suscripción:', updateError);
    return false;
  }
  
  // Obtener el plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('name')
    .eq('id', data.plan_id)
    .single();
  
  // Actualizar el nivel de suscripción en el perfil
  if (plan) {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: plan.name.toLowerCase(),
      })
      .eq('id', data.user_id);
  }
  
  // Registrar en historial de pagos
  await supabase
    .from('payment_history')
    .insert({
      user_id: data.user_id,
      subscription_id: data.id,
      amount: subscription.billing_info?.last_payment?.amount?.value || '0',
      currency: subscription.billing_info?.last_payment?.amount?.currency_code || 'USD',
      status: 'completed',
      provider: 'paypal',
      payment_id: subscription.id,
      payment_method: 'paypal',
    });
  
  return true;
}

// Procesar evento de suscripción cancelada
async function handleSubscriptionCancelled(event: any) {
  const supabase = createClientComponent();
  const subscription = event.resource;
  
  if (!subscription || !subscription.id) {
    console.error('Evento de suscripción sin ID');
    return false;
  }
  
  // Buscar la suscripción en nuestra base de datos
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('subscription_id', subscription.id)
    .single();
    
  if (error || !data) {
    console.error('Suscripción no encontrada:', error);
    return false;
  }
  
  // Actualizar estado de la suscripción
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id);
  
  if (updateError) {
    console.error('Error al actualizar suscripción:', updateError);
    return false;
  }
  
  // Actualizar el perfil a free
  await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
    })
    .eq('id', data.user_id);
  
  return true;
}

// Procesar evento de pago completado
async function handlePaymentCompleted(event: any) {
  const supabase = createClientComponent();
  const payment = event.resource;
  
  if (!payment || !payment.id) {
    console.error('Evento de pago sin ID');
    return false;
  }
  
  // Si es un pago de suscripción, buscamos la suscripción
  if (payment.supplementary_data?.related_ids?.subscription_id) {
    const subscriptionId = payment.supplementary_data.related_ids.subscription_id;
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();
    
    if (subscription) {
      // Registrar el pago
      await supabase
        .from('payment_history')
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          amount: payment.amount?.value || '0',
          currency: payment.amount?.currency_code || 'USD',
          status: 'completed',
          provider: 'paypal',
          payment_id: payment.id,
          payment_method: 'paypal',
        });
      
      // Actualizar la fecha del próximo período
      if (payment.supplementary_data?.next_billing_date) {
        await supabase
          .from('subscriptions')
          .update({
            current_period_end: payment.supplementary_data.next_billing_date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
      }
    }
  }
  
  return true;
}

// Handler principal para webhooks de PayPal
export async function POST(req: Request) {
  // Verificar que WEBHOOK_ID está configurado
  if (!WEBHOOK_ID) {
    console.error('PAYPAL_WEBHOOK_ID no configurado');
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
  }
  
  try {
    // Verificar la autenticidad del webhook
    const { verified, body } = await verifyWebhookSignature(req, WEBHOOK_ID);
    
    if (!verified) {
      console.error('Verificación de webhook fallida');
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 401 });
    }
    
    const eventType = body.event_type;
    console.log(`Procesando evento PayPal: ${eventType}`);
    
    // Manejar diferentes tipos de eventos
    let success = false;
    
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        success = await handleSubscriptionCreated(body);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        success = await handleSubscriptionCancelled(body);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
      case 'PAYMENT.CAPTURE.COMPLETED':
        success = await handlePaymentCompleted(body);
        break;
        
      default:
        // Ignorar otros eventos
        success = true;
        break;
    }
    
    if (success) {
      return NextResponse.json({ status: 'success' });
    } else {
      return NextResponse.json(
        { error: 'Error al procesar el evento' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error al procesar webhook de PayPal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar webhook' },
      { status: 500 }
    );
  }
} 
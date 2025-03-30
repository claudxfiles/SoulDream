import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const PAYPAL_API = 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Crear suscripción en PayPal
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${session.user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: {
            given_name: session.user.email?.split('@')[0] || 'Usuario',
            surname: 'SoulDream'
          },
          email_address: session.user.email
        },
        application_context: {
          brand_name: 'SoulDream',
          locale: 'es-ES',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
        },
      }),
    });

    const subscription = await response.json();
    
    if (subscription.id) {
      // Guardar suscripción provisional en la base de datos
      await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          paypal_subscription_id: subscription.id,
          status: 'APPROVAL_PENDING',
          current_period_start: new Date().toISOString(),
        });
    }
    
    // Devolver la URL de aprobación para redirigir al usuario
    const approvalLink = subscription.links?.find((link: any) => link.rel === 'approve');
    
    if (!approvalLink) {
      throw new Error('No se encontró el enlace de aprobación');
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink.href
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error al crear la suscripción' },
      { status: 500 }
    );
  }
} 
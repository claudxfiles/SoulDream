import { NextResponse } from 'next/server';
import { createClientComponent } from '@/lib/supabase';

const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
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

export async function POST(request: Request) {
  try {
    const { planId } = await request.json();

    // Verificar autenticación
    const supabase = createClientComponent();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener token de acceso de PayPal
    const accessToken = await getAccessToken();

    // Crear suscripción en PayPal
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        subscriber: {
          name: {
            given_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          },
          email_address: session.user.email,
        },
        application_context: {
          brand_name: 'SoulDream',
          locale: 'es-ES',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
        },
      }),
    });

    const subscriptionData = await response.json();

    if (!response.ok) {
      console.error('Error de PayPal:', subscriptionData);
      return NextResponse.json(
        { error: 'Error al crear la suscripción' },
        { status: response.status }
      );
    }

    // Actualizar el nivel de suscripción en Supabase
    let tier = 'free';
    if (planId === 'P-5ML4271244454362XMVZEWLY') {
      tier = 'pro';
    } else if (planId === 'P-5ML4271244454362XMVZEWLZ') {
      tier = 'premium';
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error actualizando perfil:', updateError);
    }

    // Guardar la suscripción en la base de datos
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        paypal_subscription_id: subscriptionData.id,
        status: subscriptionData.status,
        plan_type: tier,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        price_paid: tier === 'pro' ? 9.99 : 19.99,
        currency: 'USD',
      });

    if (subscriptionError) {
      console.error('Error guardando suscripción:', subscriptionError);
    }

    return NextResponse.json({
      subscriptionId: subscriptionData.id,
      status: subscriptionData.status,
      approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve')?.href,
    });

  } catch (error) {
    console.error('Error en create-subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
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
    const { subscriptionId } = await request.json();

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

    // Cancelar suscripción en PayPal
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Cancelled by user',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error de PayPal:', error);
      return NextResponse.json(
        { error: 'Error al cancelar la suscripción en PayPal' },
        { status: response.status }
      );
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
      })
      .eq('paypal_subscription_id', subscriptionId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error actualizando suscripción:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la suscripción en la base de datos' },
        { status: 500 }
      );
    }

    // Actualizar el perfil del usuario a 'free' al final del período
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', session.user.id);

    if (profileError) {
      console.error('Error actualizando perfil:', profileError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error en cancel-subscription:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
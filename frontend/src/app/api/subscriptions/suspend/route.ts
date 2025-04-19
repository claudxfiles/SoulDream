import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const PAYPAL_API_URL = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Función para obtener el token de acceso de PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos de la solicitud
    const { subscriptionId, reason = 'User requested suspension' } = await request.json();
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID de suscripción no proporcionado' },
        { status: 400 }
      );
    }

    // Obtener la suscripción de la base de datos
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !subscription) {
      console.error('Error al obtener suscripción:', dbError);
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la suscripción esté activa antes de intentar suspenderla
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { 
          error: 'La suscripción no puede ser suspendida porque no está activa',
          status: subscription.status
        },
        { status: 400 }
      );
    }

    // Obtener token de acceso de PayPal
    const accessToken = await getPayPalAccessToken();

    // Suspender suscripción en PayPal
    const suspendResponse = await fetch(
      `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason
        }),
      }
    );

    if (!suspendResponse.ok) {
      const errorData = await suspendResponse.text();
      console.error('Error al suspender en PayPal:', errorData);
      throw new Error('Failed to suspend PayPal subscription');
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          suspended_at: new Date().toISOString(),
          suspension_reason: reason
        }
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error al actualizar en base de datos:', updateError);
      throw new Error('Failed to update subscription status in database');
    }

    return NextResponse.json({
      message: 'Subscription suspended successfully',
      status: 'suspended'
    });

  } catch (error) {
    console.error('Error en suspensión:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al suspender la suscripción',
        details: error
      },
      { status: 500 }
    );
  }
} 
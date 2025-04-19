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

// Función para obtener el estado actual de la suscripción
async function getSubscriptionStatus(subscriptionId: string, accessToken: string) {
  const response = await fetch(
    `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get subscription status from PayPal');
  }

  const data = await response.json();
  return data.status;
}

// Función para crear una nueva suscripción
async function createNewSubscription(planId: string, accessToken: string) {
  const response = await fetch(
    `${PAYPAL_API_URL}/v1/billing/subscriptions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Error al crear nueva suscripción en PayPal:', errorData);
    throw new Error('Failed to create new PayPal subscription');
  }

  return await response.json();
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
    const { subscriptionId } = await request.json();
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

    // Obtener token de acceso de PayPal
    const accessToken = await getPayPalAccessToken();

    // Verificar estado actual de la suscripción en PayPal
    const paypalStatus = await getSubscriptionStatus(subscriptionId, accessToken);
    console.log('Estado actual de suscripción en PayPal:', paypalStatus);

    if (paypalStatus === 'SUSPENDED') {
      // Si está suspendida, intentar reactivar
      const reactivateResponse = await fetch(
        `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/activate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Reactivation requested by user'
          }),
        }
      );

      if (!reactivateResponse.ok) {
        const errorData = await reactivateResponse.text();
        console.error('Error al reactivar en PayPal:', errorData);
        throw new Error('Failed to reactivate PayPal subscription');
      }
    } else if (paypalStatus === 'CANCELLED') {
      // Si está cancelada, crear una nueva suscripción
      // Redirigir al usuario al flujo de nueva suscripción
      return NextResponse.json({
        message: 'Subscription is cancelled. Please create a new subscription.',
        action: 'CREATE_NEW',
        redirect_url: '/dashboard/profile/subscription'
      }, { status: 200 });
    } else {
      throw new Error(`Invalid subscription status: ${paypalStatus}`);
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
        metadata: {
          ...subscription.metadata,
          reactivated_at: new Date().toISOString(),
        }
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error al actualizar en base de datos:', updateError);
      throw new Error('Failed to update subscription status in database');
    }

    return NextResponse.json({
      message: 'Subscription reactivated successfully',
      status: 'active'
    });

  } catch (error) {
    console.error('Error en reactivación:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al reactivar la suscripción',
        details: error
      },
      { status: 500 }
    );
  }
} 
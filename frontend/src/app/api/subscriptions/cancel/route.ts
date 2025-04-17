import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const PAYPAL_API_URL = process.env.NEXT_PUBLIC_PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
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

export async function POST(request: Request) {
  try {
    const { subscriptionId, reason } = await request.json();
    console.log('Recibida solicitud de cancelación para:', subscriptionId);

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID de suscripción no proporcionado' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Error de sesión:', sessionError);
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
      console.error('Error al obtener suscripción:', subscriptionError);
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Obtener token de PayPal
    const accessToken = await getPayPalAccessToken();
    console.log('Token de acceso obtenido, verificando estado de suscripción');

    // Verificar estado de suscripción en PayPal
    try {
      const paypalStatus = await getSubscriptionStatus(subscriptionId, accessToken);
      console.log('Estado de suscripción en PayPal:', paypalStatus);

      if (paypalStatus !== 'ACTIVE' && paypalStatus !== 'SUSPENDED') {
        return NextResponse.json(
          { 
            error: 'Estado de suscripción inválido',
            details: `La suscripción está en estado ${paypalStatus} y no puede ser cancelada`
          },
          { status: 400 }
        );
      }

      // Cancelar suscripción en PayPal
      console.log('Procediendo a cancelar suscripción en PayPal');
      const cancelResponse = await fetch(
        `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reason: reason || 'Cancelled by user'
          }),
        }
      );

      const responseText = await cancelResponse.text();
      console.log('Respuesta de PayPal:', {
        status: cancelResponse.status,
        body: responseText
      });

      if (!cancelResponse.ok) {
        let errorDetails;
        try {
          errorDetails = JSON.parse(responseText);
        } catch (e) {
          errorDetails = responseText;
        }
        throw new Error(`Error de PayPal: ${JSON.stringify(errorDetails)}`);
      }

      // Actualizar estado en la base de datos
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: now,
          metadata: {
            cancelled_at: now,
            cancel_at_period_end: true,
            cancellation_reason: reason || 'Cancelled by user'
          }
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error al actualizar suscripción:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar el estado de la suscripción' },
          { status: 500 }
        );
      }

      // Registrar el evento de cancelación
      await supabase
        .from('subscription_events')
        .insert({
          subscription_id: subscription.id,
          event_type: 'subscription_cancelled',
          metadata: {
            cancelled_at: now,
            reason: reason || 'Cancelled by user',
            paypal_subscription_id: subscriptionId
          }
        });

      // Actualizar el perfil del usuario
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          updated_at: now
        })
        .eq('id', session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Suscripción cancelada exitosamente'
      });

    } catch (paypalError) {
      console.error('Error al interactuar con PayPal:', paypalError);
      return NextResponse.json(
        { 
          error: 'Error al cancelar la suscripción en PayPal', 
          details: paypalError instanceof Error ? paypalError.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error general en cancelación:', error);
    return NextResponse.json(
      { error: 'Error al procesar la cancelación', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
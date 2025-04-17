import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando proceso de cancelación para suscripción:', params.id);
    console.log('PayPal API URL:', PAYPAL_API_URL);
    console.log('PayPal Mode:', process.env.PAYPAL_MODE);
    
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log('No hay sesión activa');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Usuario autenticado:', session.user.id);

    // Obtener la suscripción y verificar que pertenece al usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (subscriptionError) {
      console.error('Error al obtener la suscripción:', subscriptionError);
      return NextResponse.json(
        { error: 'Error al obtener la suscripción', details: subscriptionError.message },
        { status: 404 }
      );
    }

    if (!subscription) {
      console.log('Suscripción no encontrada');
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    console.log('Suscripción encontrada:', subscription);

    // Si hay un PayPal subscription ID, cancelar en PayPal
    if (subscription.paypal_subscription_id) {
      try {
        console.log('Obteniendo token de PayPal...');
        
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_SECRET;

        if (!clientId || !clientSecret) {
          throw new Error('Credenciales de PayPal no configuradas');
        }

        console.log('Credenciales de PayPal configuradas correctamente');

        // Primero obtenemos el token de acceso de PayPal
        const authResponse = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials'
        });

        if (!authResponse.ok) {
          const authError = await authResponse.json();
          console.error('Error en autenticación PayPal:', authError);
          throw new Error(`Error al obtener el token de PayPal: ${authError.error_description || 'Unknown error'}`);
        }

        const authData = await authResponse.json();
        console.log('Token de PayPal obtenido exitosamente');

        // Cancelar la suscripción directamente
        console.log('Cancelando suscripción en PayPal:', subscription.paypal_subscription_id);
        const response = await fetch(
          `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.access_token}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              reason: "Customer requested cancellation"
            })
          }
        );

        const responseText = await response.text();
        console.log('Respuesta completa de PayPal:', responseText);

        if (!response.ok) {
          let errorDetails;
          try {
            errorDetails = JSON.parse(responseText);
          } catch (e) {
            errorDetails = responseText;
          }
          console.error('Error respuesta PayPal:', errorDetails);
          throw new Error(`Error al cancelar la suscripción en PayPal: ${JSON.stringify(errorDetails)}`);
        }

        console.log('Suscripción cancelada exitosamente en PayPal');
      } catch (error) {
        console.error('Error detallado cancelando suscripción en PayPal:', error);
        return NextResponse.json(
          { error: 'Error al cancelar la suscripción en PayPal', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

    // Actualizar el estado de la suscripción en la base de datos
    console.log('Actualizando estado de suscripción en base de datos...');
    const cancelledAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        metadata: {
          ...subscription.metadata,
          cancelled_at: cancelledAt
        },
        updated_at: cancelledAt
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error al actualizar suscripción:', updateError);
      throw new Error(`Error al actualizar el estado de la suscripción: ${updateError.message}`);
    }

    console.log('Estado de suscripción actualizado correctamente');

    // Registrar el evento de cancelación
    console.log('Registrando evento de cancelación...');
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscription.id,
        event_type: 'subscription_cancelled',
        metadata: {
          cancelled_at: cancelledAt,
          effective_end_date: subscription.current_period_ends_at,
          reason: 'Cancelled by user'
        }
      });

    if (eventError) {
      console.error('Error al registrar evento:', eventError);
      // No lanzamos error aquí para no interrumpir el proceso principal
    }

    console.log('Proceso de cancelación completado exitosamente');
    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada exitosamente. Se mantendrá activa hasta el final del período actual.',
      effective_end_date: subscription.current_period_ends_at
    });

  } catch (error) {
    console.error('Error general en la cancelación de suscripción:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al procesar la cancelación',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
} 
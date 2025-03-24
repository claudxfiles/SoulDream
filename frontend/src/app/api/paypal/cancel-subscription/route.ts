import { NextResponse } from 'next/server';
import { createClientComponent } from '@/lib/supabase';

// Configuración de PayPal
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Función para obtener token de acceso de PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

// Función para cancelar una suscripción de PayPal
async function cancelPayPalSubscription(subscriptionId: string, reason: string = 'Cancelled by user') {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      reason
    })
  });

  // Si la respuesta es 204, la cancelación fue exitosa
  if (response.status === 204) {
    return { success: true };
  }

  // En caso de error, intentar obtener el mensaje
  const errorData = await response.json().catch(() => ({}));
  return { 
    success: false, 
    error: errorData.error_description || 'Error al cancelar la suscripción' 
  };
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const supabase = createClientComponent();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener ID de suscripción
    const { subscriptionId, reason } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID de suscripción requerido' }, { status: 400 });
    }

    // Verificar que la suscripción pertenece al usuario
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (subscriptionError || !subscription) {
      console.error('Error al verificar suscripción:', subscriptionError);
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    // Cancelar la suscripción en PayPal
    if (subscription.payment_provider === 'paypal' && subscription.subscription_id) {
      const result = await cancelPayPalSubscription(subscription.subscription_id, reason);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    // Actualizar estado en la base de datos
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error al actualizar estado de suscripción:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la suscripción' }, { status: 500 });
    }

    // Actualizar perfil a 'free'
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada correctamente'
    });
    
  } catch (error: any) {
    console.error('Error al cancelar suscripción de PayPal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cancelar la suscripción' },
      { status: 500 }
    );
  }
} 
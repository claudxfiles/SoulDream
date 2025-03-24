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

// Función para capturar un pago de PayPal
async function capturePayment(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `${Date.now()}`
    }
  });

  const data = await response.json();
  return data;
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const supabase = createClientComponent();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener orderId de la URL
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
    }

    // Capturar el pago
    const captureData = await capturePayment(orderId);

    // Si hubo un error en PayPal
    if (captureData.error) {
      console.error('Error al capturar pago de PayPal:', captureData);
      return NextResponse.json({ error: captureData.error_description || 'Error al capturar pago' }, { status: 500 });
    }

    // Registrar el pago en la base de datos
    const amount = captureData.purchase_units[0].payments.captures[0].amount.value;
    const currency = captureData.purchase_units[0].payments.captures[0].amount.currency_code;
    const paymentId = captureData.purchase_units[0].payments.captures[0].id;
    
    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: session.user.id,
      payment_id: paymentId,
      amount,
      currency,
      status: 'completed',
      payment_method: 'paypal',
      payment_details: captureData
    });

    if (paymentError) {
      console.error('Error al registrar pago en la base de datos:', paymentError);
    }

    // Devolver información del pago capturado
    return NextResponse.json({
      success: true,
      paymentId,
      status: captureData.status,
      amount,
      currency
    });
    
  } catch (error: any) {
    console.error('Error al capturar pago de PayPal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
} 
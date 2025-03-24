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

// Función para crear una orden de PayPal
async function createOrder(amount: string, currency: string, description: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `${Date.now()}`
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount
          },
          description
        }
      ],
      application_context: {
        brand_name: 'SoulDream',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`
      }
    })
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

    // Obtener parámetros
    const { amount, currency = 'USD', description = 'SoulDream Subscription' } = await request.json();

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
    }

    // Crear orden de PayPal
    const order = await createOrder(amount, currency, description);

    // Si hubo un error en PayPal
    if (order.error) {
      console.error('Error de PayPal:', order);
      return NextResponse.json({ error: order.error_description || 'Error de PayPal' }, { status: 500 });
    }

    // Devolver la información de la orden
    return NextResponse.json({ 
      id: order.id,
      status: order.status,
      links: order.links
    });
    
  } catch (error: any) {
    console.error('Error al crear orden de PayPal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
} 
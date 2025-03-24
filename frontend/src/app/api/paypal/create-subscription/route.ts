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

// Función para crear un producto en PayPal (si no existe)
async function createPayPalProduct(plan: any) {
  const accessToken = await getPayPalAccessToken();
  
  // Si ya tenemos un ID de producto para este plan, no necesitamos crear uno nuevo
  if (plan.paypal_product_id) {
    return plan.paypal_product_id;
  }
  
  // Crear un nuevo producto
  const response = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `product-${Date.now()}`
    },
    body: JSON.stringify({
      name: `SoulDream ${plan.name}`,
      description: plan.description || `Plan de suscripción ${plan.name}`,
      type: 'SERVICE',
      category: 'SOFTWARE'
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('Error al crear producto en PayPal:', data);
    throw new Error(data.error_description || 'Error al crear producto en PayPal');
  }
  
  return data.id;
}

// Función para crear un plan de precio en PayPal
async function createPayPalPlan(planId: string, plan: any, productId: string) {
  const accessToken = await getPayPalAccessToken();
  
  // Si ya tenemos un ID de plan de PayPal para este plan, no necesitamos crear uno nuevo
  if (plan.paypal_plan_id) {
    return plan.paypal_plan_id;
  }
  
  // Crear un nuevo plan de precios
  const response = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `plan-${Date.now()}`
    },
    body: JSON.stringify({
      product_id: productId,
      name: `SoulDream ${plan.name}`,
      description: plan.description || `Plan de suscripción ${plan.name}`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: plan.interval === 'month' ? 'MONTH' : 'YEAR',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Sin límite
          pricing_scheme: {
            fixed_price: {
              value: plan.price.toString(),
              currency_code: plan.currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: plan.currency
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('Error al crear plan en PayPal:', data);
    throw new Error(data.error_description || 'Error al crear plan en PayPal');
  }
  
  // Actualizar la base de datos con el ID del plan de PayPal
  const supabase = createClientComponent();
  await supabase
    .from('subscription_plans')
    .update({ 
      paypal_plan_id: data.id,
      paypal_product_id: productId 
    })
    .eq('id', planId);
  
  return data.id;
}

// Función para crear una suscripción en PayPal
async function createSubscription(paypalPlanId: string, returnUrl: string, cancelUrl: string) {
  const accessToken = await getPayPalAccessToken();
  
  const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `subscription-${Date.now()}`
    },
    body: JSON.stringify({
      plan_id: paypalPlanId,
      application_context: {
        brand_name: 'SoulDream',
        locale: 'es-ES',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: returnUrl,
        cancel_url: cancelUrl
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
    const { planId, returnUrl, cancelUrl } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'ID de plan requerido' }, { status: 400 });
    }

    if (!returnUrl || !cancelUrl) {
      return NextResponse.json({ error: 'URLs de retorno requeridas' }, { status: 400 });
    }

    // Obtener detalles del plan
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error || !plan) {
      console.error('Error al obtener detalles del plan:', error);
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // No crear suscripción para el plan Free
    if (plan.price === 0) {
      const now = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(now.getFullYear() + 1);
      
      // Crear suscripción gratuita directamente en la base de datos
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          status: 'active',
          payment_provider: 'none',
          current_period_start: now.toISOString(),
          current_period_end: nextYear.toISOString()
        })
        .select('*')
        .single();
      
      if (subscriptionError) {
        console.error('Error al crear suscripción gratuita:', subscriptionError);
        return NextResponse.json({ error: 'Error al crear suscripción gratuita' }, { status: 500 });
      }
      
      // Actualizar el perfil del usuario
      await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', session.user.id);
      
      return NextResponse.json({ 
        id: subscription.id,
        status: 'active',
        approvalUrl: returnUrl 
      });
    }

    // Crear o recuperar el producto en PayPal
    const productId = await createPayPalProduct(plan);
    
    // Crear o recuperar el plan de precios en PayPal
    const paypalPlanId = await createPayPalPlan(planId, plan, productId);
    
    // Crear la suscripción en PayPal
    const subscription = await createSubscription(paypalPlanId, returnUrl, cancelUrl);

    // Si hubo un error en PayPal
    if (subscription.error) {
      console.error('Error de PayPal:', subscription);
      return NextResponse.json({ error: subscription.error_description || 'Error de PayPal' }, { status: 500 });
    }

    // Buscar la URL de aprobación
    const approvalUrl = subscription.links.find((link: any) => link.rel === 'approve').href;

    // Devolver ID de suscripción y URL de aprobación
    return NextResponse.json({ 
      id: subscription.id,
      status: subscription.status,
      approvalUrl 
    });
    
  } catch (error: any) {
    console.error('Error al crear suscripción de PayPal:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
} 
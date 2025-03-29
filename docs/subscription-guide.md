# Guía de Implementación del Sistema de Suscripciones

Esta guía te ayudará a implementar el sistema completo de suscripciones y pagos para SoulDream.

## 1. Configuración de la Base de Datos

Primero, necesitas configurar las tablas en Supabase:

1. Accede al dashboard de Supabase y ve a la sección "SQL Editor"
2. Crea un nuevo query
3. Copia y pega el contenido del archivo `sql/subscription-system.sql`
4. Ejecuta el script
5. Verifica que se hayan creado las tablas:
   - `subscription_plans`
   - `subscriptions`
   - `payment_history`
6. Confirma que la columna `subscription_tier` se ha añadido a la tabla `profiles`

## 2. Configuración de PayPal

Sigue las instrucciones en `docs/paypal-setup.md` para:

1. Crear una cuenta de desarrollador en PayPal
2. Obtener las credenciales necesarias para el entorno Sandbox
3. Configurar las variables de entorno en tu proyecto
## 3. Verificar la Implementación frontend 
-Interfaces de usuario para selección de planes
-Formularios de pago
-Redirección a PayPal cuando sea necesario
-Visualización del estado de suscripción

## 3.1 Verificar la Implementación backend 
Crea un archivo para manejar las comunicaciones con PayPal que sea accesible SOLO desde el servidor:
-Almacenamiento seguro de claves API de PayPal
-Creación y gestión de órdenes de pago
-Verificación de pagos completados
-Procesamiento de webhooks de PayPal
-Actualización de la base de datos con estados de suscripción
-Lógica de negocio para control de acceso
```tsx
// lib/paypal-server.ts (NO EXPONER AL FRONTEND)
import fetch from 'node-fetch';

class PayPalServerAPI {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    
    if (!this.clientId || !this.clientSecret) {
      console.error('PayPal credentials not configured');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${data.error_description}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
    
    return this.accessToken;
  }

  async createOrder(amount: number, currency: string = 'USD'): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        }],
      }),
    });

    return await response.json();
  }

  async capturePayment(orderId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  }

  async createSubscription(planId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          return_url: process.env.PAYPAL_RETURN_URL,
          cancel_url: process.env.PAYPAL_CANCEL_URL,
        },
      }),
    });

    return await response.json();
  }

  async cancelSubscription(subscriptionId: string, reason: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to cancel subscription: ${errorData.message || 'Unknown error'}`);
    }
    
    return { success: true };
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  }

  // Método para verificar webhooks (importante para eventos de suscripción)
  async verifyWebhookSignature(headers: any, body: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
      }),
    });

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  }
}

export const paypalServer = new PayPalServerAPI();
```
## Rutas API para el Backend
Crea las siguientes rutas API que actúan como intermediarios entre el frontend y PayPal:
```tsx
// app/api/paypal/create-order/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paypalServer } from '@/lib/paypal-server';

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    
    // Obtener el plan de la base de datos
    const supabase = createRouteHandlerClient({ cookies });
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }
    
    // Crear orden en PayPal (para pagos únicos)
    const order = await paypalServer.createOrder(plan.price, 'USD');
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden de pago' }, 
      { status: 500 }
    );
  }
}
```
```tsx
// app/api/paypal/capture-payment/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paypalServer } from '@/lib/paypal-server';

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    
    // Capturar el pago en PayPal
    const paymentResult = await paypalServer.capturePayment(orderId);
    
    if (paymentResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'El pago no se completó correctamente' },
        { status: 400 }
      );
    }
    
    // Obtener información del usuario autenticado
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Guardar registro de pago en la base de datos
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        user_id: session.user.id,
        payment_id: paymentResult.id,
        amount: parseFloat(paymentResult.purchase_units[0].amount.value),
        status: paymentResult.status,
        payment_method: 'paypal',
        details: paymentResult
      });
    
    if (paymentError) {
      console.error('Error saving payment:', paymentError);
    }
    
    return NextResponse.json({ 
      success: true, 
      orderId: paymentResult.id,
      status: paymentResult.status
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
```

```tsx
// app/api/paypal/create-subscription/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paypalServer } from '@/lib/paypal-server';

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();
    
    // Obtener el plan de la base de datos
    const supabase = createRouteHandlerClient({ cookies });
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    // Crear suscripción en PayPal
    const subscription = await paypalServer.createSubscription(plan.paypal_plan_id);
    
    if (subscription.id) {
      // Guardar suscripción provisional en la base de datos
      await supabase
        .from('subscriptions')
        .insert({
          user_id: session.user.id,
          plan_id: planId,
          paypal_subscription_id: subscription.id,
          status: 'APPROVAL_PENDING',
          current_period_start: new Date().toISOString(),
          current_period_end: null // Se actualizará cuando se active
        });
    }
    
    // Devolver la URL de aprobación para redirigir al usuario
    const approvalLink = subscription.links.find((link: any) => link.rel === 'approve');
    
    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink ? approvalLink.href : null
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error al crear la suscripción' },
      { status: 500 }
    );
  }
}
```

```tsx
// app/api/paypal/cancel-subscription/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paypalServer } from '@/lib/paypal-server';

export async function POST(req: Request) {
  try {
    const { subscriptionId, reason } = await req.json();
    
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
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
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }
    
    // Cancelar suscripción en PayPal
    await paypalServer.cancelSubscription(
      subscriptionId, 
      reason || 'Cancelled by user'
    );
    
    // Actualizar estado en la base de datos
    await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscriptionId);
    
    // Actualizar nivel de suscripción del usuario
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free'
      })
      .eq('id', session.user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la suscripción' },
      { status: 500 }
    );
  }
}
```

```tsx
// app/api/paypal/webhooks/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paypalServer } from '@/lib/paypal-server';

// Cliente Supabase con clave de servicio para operaciones de webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function POST(req: Request) {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers);
  
  try {
    // Verificar que la solicitud viene de PayPal
    const isVerified = await paypalServer.verifyWebhookSignature(headers, body);
    
    if (!isVerified) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const webhookEvent = JSON.parse(body);
    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;
    
    console.log(`Processing PayPal webhook: ${eventType}`);
    
    // Manejar diferentes tipos de eventos
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Suscripción activada después de la aprobación del usuario
        const subscriptionId = resource.id;
        const details = await paypalServer.getSubscriptionDetails(subscriptionId);
        
        // Obtener el plan asociado a esta suscripción
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('paypal_subscription_id', subscriptionId)
          .single();
          
        if (subscription) {
          // Actualizar la suscripción
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'ACTIVE',
              current_period_start: details.start_time,
              current_period_end: details.billing_info.next_billing_time,
              plan_id: subscription.plan_id
            })
            .eq('paypal_subscription_id', subscriptionId);
            
          // Actualizar el nivel de suscripción del usuario
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: subscription.subscription_plans.name.toLowerCase()
            })
            .eq('id', subscription.user_id);
        }
        break;
      }
      
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // Suscripción cancelada o expirada
        const subscriptionId = resource.id;
        
        // Obtener la suscripción
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('paypal_subscription_id', subscriptionId)
          .single();
          
        if (subscription) {
          // Actualizar estado
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ? 'EXPIRED' : 'CANCELLED',
              cancelled_at: new Date().toISOString()
            })
            .eq('paypal_subscription_id', subscriptionId);
            
          // Actualizar nivel de suscripción del usuario
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: 'free'
            })
            .eq('id', subscription.user_id);
        }
        break;
      }
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        // Pago fallido - se podría enviar notificación al usuario
        break;
      }
      
      case 'PAYMENT.SALE.COMPLETED': {
        // Pago completado - registrar en el historial
        const paymentId = resource.id;
        const subscriptionId = resource.billing_agreement_id;
        
        if (subscriptionId) {
          // Buscar la suscripción asociada
          const { data: subscription } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('paypal_subscription_id', subscriptionId)
            .single();
            
          if (subscription) {
            // Registrar el pago
            await supabaseAdmin
              .from('payment_history')
              .insert({
                user_id: subscription.user_id,
                payment_id: paymentId,
                amount: parseFloat(resource.amount.total),
                status: 'COMPLETED',
                payment_method: 'paypal',
                details: resource
              });
              
            // Actualizar fecha de próximo pago
            await supabaseAdmin
              .from('subscriptions')
              .update({
                current_period_start: new Date().toISOString(),
                current_period_end: resource.billing_agreement_id 
                  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 días aproximadamente 
                  : null
              })
              .eq('paypal_subscription_id', subscriptionId);
          }
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}
```
## Cliente Seguro para el Frontend
Crea un cliente simple para el frontend que se comunique SOLO con tus API Routes:
```tsx
// lib/paypal-client.ts (VERSIÓN SEGURA PARA FRONTEND)
export const paypalClient = {
  async createOrder(planId: string) {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    if (!response.ok) {
      throw new Error('Error al crear la orden');
    }
    
    return await response.json();
  },
  
  async capturePayment(orderId: string) {
    const response = await fetch('/api/paypal/capture-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    
    if (!response.ok) {
      throw new Error('Error al capturar el pago');
    }
    
    return await response.json();
  },
  
  async createSubscription(planId: string) {
    const response = await fetch('/api/paypal/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    if (!response.ok) {
      throw new Error('Error al crear la suscripción');
    }
    
    return await response.json();
  },
  
  async cancelSubscription(subscriptionId: string, reason: string) {
    const response = await fetch('/api/paypal/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, reason })
    });
    
    if (!response.ok) {
      throw new Error('Error al cancelar la suscripción');
    }
    
    return await response.json();
  }
};
```
##  Componentes Frontend
Los componentes frontend permanecen casi iguales, pero ahora se comunicarán con tu backend en lugar de directamente con PayPal.

Página de Precios:
```tsx
// app/pricing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paypalClient } from '@/lib/paypal-client';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useSupabase } from '@/hooks/useSupabase';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase, user } = useSupabase();
  const router = useRouter();
  
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
        
      if (!error && data) {
        setPlans(data);
      }
      setIsLoading(false);
    };
    
    fetchPlans();
  }, []);
  
  const handleSubscribe = async (planId) => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }
    
    try {
      setIsLoading(true);
      const { subscriptionId, approvalUrl } = await paypalClient.createSubscription(planId);
      
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error('No se recibió URL de aprobación');
      }
    } catch (error) {
      console.error('Error al iniciar suscripción:', error);
      alert('No se pudo iniciar el proceso de suscripción. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resto del componente...
}
```


## 4. API Routes en Next.js

API Routes en Next.js
Si estás usando Next.js, puedes implementar rutas API que actúan como tu backend:
/api/paypal/
  ├── create-order.ts       # Crea orden de pago (llamada desde frontend)
  ├── capture-payment.ts    # Captura pago confirmado (llamada desde frontend)
  ├── webhooks.ts           # Recibe notificaciones de PayPal
  ├── create-subscription.ts # Crea suscripción recurrente
  └── cancel-subscription.ts # Cancela suscripción

2. Prueba el flujo completo:
   - Regístrate/inicia sesión
   - Navega a `/pricing`
   - Selecciona un plan
   - Completa el proceso de pago con una cuenta de prueba de PayPal
   - Verifica que te redirija a la página de éxito
   - Comprueba que tu suscripción aparezca en `/subscription/manage`
   - Verifica que el nivel de suscripción se actualice en tu perfil

3. Prueba la cancelación:
   - Ve a `/subscription/manage`
   - Haz clic en "Cancelar Suscripción"
   - Confirma la cancelación
   - Verifica que el estado cambie a "Cancelada"

## 5. Implementación recomendada

1. Seguridad de credenciales:

  -Almacena las claves secretas de PayPal solo en variables de entorno del servidor
  -En el frontend usa solo la clave pública (Client ID)
2. Flujo de pago seguro:

  -Frontend solicita al backend crear una orden
  -Backend crea la orden con PayPal y devuelve un ID
  -Frontend usa ese ID para completar el pago con PayPal
  -PayPal redirige de vuelta a tu app
  -Frontend solicita al backend verificar y capturar el pago
  -Backend verifica y actualiza la base de datos
3. Gestión de webhooks:

  -Configura endpoints en tu backend para recibir notificaciones de PayPal
  -Procesa eventos como renovaciones, pagos fallidos, cancelaciones
  -Actualiza la base de datos y estados de usuario según corresponda

## Ejemplo de estructura correcta
Backend (API Routes)
```tsx
// api/paypal/create-subscription.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { paypalClient } from '@/lib/paypal-server'; // Librería segura solo en servidor

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { planId, userId } = req.body;
    
    // Verificar autenticación
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Clave de servicio solo disponible en el servidor
    );
    
    // Crear suscripción en PayPal
    const subscription = await paypalClient.createSubscription({
      plan_id: planId,
      // otros parámetros necesarios
    });
    
    // Guardar datos en la base de datos
    await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        paypal_subscription_id: subscription.id,
        status: subscription.status,
        plan_id: planId,
      });
    
    return res.status(200).json({ 
      subscriptionId: subscription.id,
      approvalUrl: subscription.links.find(link => link.rel === 'approve').href
    });
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    return res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
}
```
## Frontend

```tsx
// pages/pricing.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  
  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    
    try {
      // Llamar a nuestra API, no directamente a PayPal
      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id })
      });
      
      const data = await response.json();
      
      if (data.approvalUrl) {
        // Redirigir al usuario a PayPal para confirmar
        window.location.href = data.approvalUrl;
      }
    } catch (error) {
      console.error('Error al iniciar suscripción:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resto del componente...
}
```


## 6. Consideraciones para Producción

Antes de desplegar en producción:

1. Cambia las credenciales de PayPal a producción
2. Configura webhooks de PayPal para tu dominio de producción
3. Prueba exhaustivamente el flujo completo
4. Implementa un sistema de notificaciones para alertar a los usuarios sobre:
   - Suscripciones próximas a renovar
   - Pagos fallidos
   - Cancelaciones exitosas
5. Configura un sistema de recuperación para:
   - Recordatorios de pago
   - Reactivación de suscripciones canceladas
   - Actualización de tarjetas expiradas

## 7. Resolución de Problemas Comunes

Si encuentras algún problema:

1. **Errores en la base de datos**: Verifica las restricciones y tipos de datos
2. **Problemas de PayPal**: Consulta los registros del Dashboard de Desarrollador
3. **Niveles de suscripción no actualizados**: Verifica el trigger de base de datos
4. **Redirecciones fallidas**: Confirma las URLs de retorno configuradas

Para soporte más detallado, consulta la documentación oficial de PayPal y Supabase. 
## 8. Probar el Sistema
El proceso de prueba sigue siendo el mismo:
1- Inicia la aplicación en modo desarrollo:

```tsx
npm run dev
```
Prueba el flujo completo:

Regístrate/inicia sesión
Navega a `/pricing`
Selecciona un plan
Completa el proceso de pago con una cuenta de prueba de PayPal
Verifica que te redirija a la página de éxito
Comprueba que tu suscripción aparezca en `/subscription/manage`
Verifica que el nivel de suscripción se actualice en tu perfil
Prueba la cancelación:

Ve a `/subscription/manage`
Haz clic en "Cancelar Suscripción"
Confirma la cancelación
Verifica que el estado cambie a "Cancelada"
9. Configuración de Webhook para Producción
En el Dashboard de Desarrollador de PayPal, configura un webhook que apunte a:
```tsx
https://3a8d-45-230-48-231.ngrok-free.app/api/subscriptions/webhook
```

Selecciona los siguientes eventos para escuchar:

`BILLING.SUBSCRIPTION.ACTIVATED`
`BILLING.SUBSCRIPTION.CANCELLED`
`BILLING.SUBSCRIPTION.EXPIRED`
`BILLING.SUBSCRIPTION.PAYMENT.FAILED`
`PAYMENT.SALE.COMPLETED`
Guarda el ID del webhook en tu variable de entorno `PAYPAL_WEBHOOK_ID`

10. Consideraciones para Producción
Las mismas que en la versión anterior, pero con estas adiciones:

  -Asegúrate de que la clave `SUPABASE_SERVICE_KEY` esté configurada correctamente para los webhooks
  -Implementa un sistema de registro (logging) más robusto para las operaciones de pago
  -Considera añadir una tabla de auditoría para seguimiento de cambios en suscripciones

Esta versión actualizada de la guía garantiza que:

  -Todas las comunicaciones con PayPal se realicen desde el backend
  -Las credenciales sensibles nunca se expongan al frontend
  -Se implementen verificaciones de seguridad para webhooks
  -Se siga un flujo de pago seguro y correcto
## Conclusión
Es crucial implementar un sistema de suscripciones con PayPal utilizando un enfoque cliente-servidor adecuado:

  1. El frontend debe ser responsable solo de la interfaz de usuario y la interacción del usuario
  2. El backend debe gestionar todas las operaciones sensibles y comunicaciones con PayPal
  3. Las credenciales secretas deben estar solo en el servidor
  4. Los webhooks deben procesarse en el backend para mantener sincronizados los estados de suscripción
Siguiendo estas prácticas, tendrás un sistema de suscripciones seguro, robusto y mantenible que protegerá tanto a tus usuarios como a tu negocio.

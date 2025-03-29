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

-Almacenamiento seguro de claves API de PayPal
-Creación y gestión de órdenes de pago
-Verificación de pagos completados
-Procesamiento de webhooks de PayPal
-Actualización de la base de datos con estados de suscripción
-Lógica de negocio para control de acceso

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

## Conclusión
Es crucial implementar un sistema de suscripciones con PayPal utilizando un enfoque cliente-servidor adecuado:

  1. El frontend debe ser responsable solo de la interfaz de usuario y la interacción del usuario
  2. El backend debe gestionar todas las operaciones sensibles y comunicaciones con PayPal
  3. Las credenciales secretas deben estar solo en el servidor
  4. Los webhooks deben procesarse en el backend para mantener sincronizados los estados de suscripción
Siguiendo estas prácticas, tendrás un sistema de suscripciones seguro, robusto y mantenible que protegerá tanto a tus usuarios como a tu negocio.

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

## 3. Verificar la Implementación Frontend

Asegúrate de que todos los archivos necesarios estén en su lugar:

### API Routes
- `/api/paypal/create-order/route.ts`
- `/api/paypal/capture-payment/route.ts`
- `/api/paypal/create-subscription/route.ts`
- `/api/paypal/cancel-subscription/route.ts`

### Servicios
- `/lib/paypal.ts`
- `/services/subscription.service.ts`

### Componentes
- `/components/subscription/PricingPlan.tsx`

### Páginas
- `/app/pricing/page.tsx`
- `/app/subscription/manage/page.tsx`
- `/app/subscription/success/page.tsx`
- `/app/subscription/cancel/page.tsx`

## 4. Probar el Sistema

Para probar que todo funciona correctamente:

1. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

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

## 5. Integración con las Funcionalidades de la Aplicación

Una vez que el sistema de suscripciones está funcionando, puedes integrarlo con las funcionalidades de tu aplicación:

### Hook de Verificación de Suscripción

Crea un hook personalizado para verificar el nivel de suscripción de un usuario:

```tsx
// hooks/useSubscription.ts
import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useSubscription(requiredTier?: 'pro' | 'premium') {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSubscription = async () => {
      setIsLoading(true);
      
      const supabase = createClientComponent();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', session.user.id)
        .single();
      
      if (error || !data) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      const tier = data.subscription_tier?.toLowerCase() || 'free';
      setUserTier(tier);
      
      if (!requiredTier) {
        // Si no se requiere un nivel específico, cualquier usuario tiene acceso
        setHasAccess(true);
      } else if (requiredTier === 'pro') {
        // Para funcionalidades Pro, los usuarios Pro y Premium tienen acceso
        setHasAccess(tier === 'pro' || tier === 'premium');
      } else if (requiredTier === 'premium') {
        // Para funcionalidades Premium, solo los usuarios Premium tienen acceso
        setHasAccess(tier === 'premium');
      }
      
      setIsLoading(false);
    };
    
    checkSubscription();
  }, [requiredTier]);

  return { isLoading, hasAccess, userTier };
}
```

### Componente de Restricción de Acceso

Crea un componente para restringir el acceso a funcionalidades según el nivel de suscripción:

```tsx
// components/subscription/SubscriptionGate.tsx
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SubscriptionGateProps {
  requiredTier: 'pro' | 'premium';
  children: React.ReactNode;
}

export function SubscriptionGate({ requiredTier, children }: SubscriptionGateProps) {
  const { isLoading, hasAccess, userTier } = useSubscription(requiredTier);
  const router = useRouter();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verificando suscripción...</span>
      </div>
    );
  }
  
  if (!hasAccess) {
    return (
      <div className="rounded-lg border p-8 shadow-sm text-center">
        <h3 className="text-xl font-bold mb-2">Actualiza tu plan</h3>
        <p className="text-muted-foreground mb-6">
          Esta funcionalidad requiere un plan {requiredTier === 'pro' ? 'Pro o Premium' : 'Premium'}.
          {userTier && userTier !== 'free' ? ' Actualiza tu plan para acceder.' : ' Suscríbete para acceder.'}
        </p>
        <Button onClick={() => router.push('/pricing')}>
          Ver Planes
        </Button>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### Uso en Componentes que Requieren Suscripción

Para proteger las funcionalidades premium:

```tsx
// components/finance/AdvancedAnalytics.tsx
import { SubscriptionGate } from '@/components/subscription/SubscriptionGate';

export function AdvancedAnalytics() {
  return (
    <SubscriptionGate requiredTier="pro">
      {/* Contenido que solo está disponible para suscriptores Pro o Premium */}
      <div>
        <h2>Análisis Financiero Avanzado</h2>
        {/* ... */}
      </div>
    </SubscriptionGate>
  );
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
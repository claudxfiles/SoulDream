'use client';

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "@/components/ui/use-toast";

interface SubscriptionButtonProps {
  planId: string;
  amount: string;
  onSuccess?: () => void;
}

interface PayPalSubscriptionData {
  subscriptionID?: string | null;
  orderID?: string | null;
}

export function SubscriptionButton({ planId, amount, onSuccess }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Definimos los IDs de los planes
  const MONTHLY_PLAN_ID = 'P-1H048096T5545353AM7U2EQQ';
  const ANNUAL_PLAN_ID = 'P-25P774007P7890240M7U2DTA';

  const createSubscriptionRecord = async (data: PayPalSubscriptionData, paypalPlanId: string) => {
    try {
      if (!data.subscriptionID) {
        throw new Error('ID de suscripción no proporcionado');
      }

      // 1. Verificar si ya existe una suscripción activa para este usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        throw new Error('Ya existe una suscripción activa para este usuario');
      }

      // 2. Obtener el plan y crear la suscripción como 'pending'
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, interval, features')
        .eq('paypal_plan_id', paypalPlanId)
        .single();

      if (planError || !planData) {
        throw new Error('No se pudo encontrar el plan de suscripción');
      }

      console.log('Plan data received:', planData);

      // 3. Calcular fechas
      const now = new Date();
      const periodEnd = new Date(now);
      if (planData.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // 4. Crear el registro de suscripción
      const subscriptionData = {
        user_id: user.id,
        plan_type: planData.interval === 'month' ? 'month' : 'year',
        status: 'active',
        subscription_id: data.subscriptionID,
        current_period_starts_at: now.toISOString(),
        current_period_ends_at: periodEnd.toISOString()
      };

      console.log('Subscription data being inserted:', subscriptionData);

      // 5. Insertar con manejo de errores detallado
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error al crear la suscripción:', subscriptionError);
        throw subscriptionError;
      }

      // 6. Registrar el evento de suscripción (si existe la tabla)
      try {
        await supabase
          .from('subscription_events')
          .insert({
            subscription_id: subscription.id,
            event_type: 'subscription_created',
            metadata: {
              paypal_subscription_id: data.subscriptionID,
              paypal_order_id: data.orderID,
              features: planData.features
            }
          });
      } catch (eventError) {
        // Si la tabla no existe, solo logueamos el error pero no interrumpimos el flujo
        console.warn('No se pudo registrar el evento de suscripción:', eventError);
      }

      return subscription;
    } catch (error) {
      console.error('Error en el proceso de suscripción:', error);
      // Aquí podríamos agregar más lógica de rollback si es necesario
      throw error;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <PayPalButtons
        createSubscription={(data, actions) => {
          return actions.subscription.create({
            plan_id: planId === ANNUAL_PLAN_ID ? ANNUAL_PLAN_ID : MONTHLY_PLAN_ID,
            application_context: {
              shipping_preference: "NO_SHIPPING",
              return_url: `${window.location.origin}/dashboard/profile/success`,
              cancel_url: `${window.location.origin}/dashboard/profile/cancel`
            }
          });
        }}
        onApprove={async (data, actions) => {
          setLoading(true);
          try {
            if (data.subscriptionID) {
              // Crear el registro de suscripción en Supabase
              await createSubscriptionRecord(data, planId);
              
              toast({
                title: "¡Suscripción exitosa!",
                description: "Tu suscripción ha sido activada correctamente.",
              });
              onSuccess?.();
            }
          } catch (error) {
            console.error('Error al procesar la suscripción:', error);
            toast({
              title: "Error",
              description: "Hubo un problema al activar tu suscripción. Por favor contacta a soporte.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        }}
        onError={(err) => {
          console.error('Error PayPal:', err);
          toast({
            title: "Error",
            description: "Hubo un error al procesar el pago. Por favor intenta de nuevo.",
            variant: "destructive",
          });
        }}
        style={{
          shape: 'pill',
          color: 'blue',
          layout: 'horizontal',
          label: 'subscribe'
        }}
        disabled={loading}
      />
    </div>
  );
} 
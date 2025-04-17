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

  console.log('SubscriptionButton rendered with planId:', planId);

  const createSubscriptionRecord = async (data: PayPalSubscriptionData, paypalPlanId: string) => {
    console.log('Creating subscription record with data:', data);
    try {
      if (!data.subscriptionID) {
        throw new Error('ID de suscripción no proporcionado');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Usuario autenticado:', user.id);

      const { data: existingSubscriptions, error: subscriptionCheckError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (subscriptionCheckError) {
        console.error('Error checking existing subscriptions:', subscriptionCheckError);
        throw new Error('Error al verificar suscripciones existentes');
      }

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        throw new Error('Ya existe una suscripción activa para este usuario');
      }

      console.log('Buscando plan con paypal_plan_id:', paypalPlanId);
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, interval, features')
        .eq('paypal_plan_id', paypalPlanId)
        .single();

      if (planError) {
        console.error('Error fetching plan:', planError);
        throw new Error('No se pudo encontrar el plan de suscripción');
      }

      if (!planData) {
        console.error('Plan not found for paypal_plan_id:', paypalPlanId);
        throw new Error('Plan no encontrado');
      }

      console.log('Plan encontrado:', planData);

      const now = new Date();
      const periodEnd = new Date(now);
      if (planData.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const subscriptionData = {
        user_id: user.id,
        plan_id: planData.id,
        plan_type: planData.interval === 'month' ? 'month' : 'year',
        status: 'active',
        paypal_subscription_id: data.subscriptionID, // Corrección: Guardar en paypal_subscription_id
        current_period_starts_at: now.toISOString(),
        current_period_ends_at: periodEnd.toISOString(),
        metadata: { 
          paypal_order_id: data.orderID,
          features: planData.features
        }
      };

      console.log('Creando registro de suscripción:', subscriptionData);

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw subscriptionError;
      }

      console.log('Suscripción creada:', subscription);

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
        console.log('Evento de suscripción registrado');
      } catch (eventError) {
        console.warn('No se pudo registrar el evento de suscripción:', eventError);
      }

      return subscription;
    } catch (error) {
      console.error('Error en el proceso de suscripción:', error);
      throw error;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <PayPalButtons
        createSubscription={(data, actions) => {
          console.log('Iniciando creación de suscripción con planId:', planId);
          return actions.subscription.create({
            plan_id: planId,
            application_context: {
              shipping_preference: "NO_SHIPPING",
              user_action: "SUBSCRIBE_NOW",
              return_url: `${window.location.origin}/dashboard/profile/subscription/success`,
              cancel_url: `${window.location.origin}/dashboard/profile/subscription/cancel`
            }
          });
        }}
        onApprove={async (data, actions) => {
          console.log('Suscripción aprobada:', data);
          setLoading(true);
          try {
            if (data.subscriptionID) {
              await createSubscriptionRecord(data, planId);
              
              toast({
                title: "¡Suscripción exitosa!",
                description: "Tu suscripción ha sido activada correctamente.",
              });
              
              // Redirigir después de un breve retraso para asegurar que los datos se han guardado
              setTimeout(() => {
                window.location.href = '/dashboard/profile/subscription?success=true';
              }, 1500);
              
              onSuccess?.();
            } else {
              console.error('No se recibió ID de suscripción');
              throw new Error('No se recibió ID de suscripción');
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
        onCancel={() => {
          console.log('Suscripción cancelada por el usuario');
          toast({
            title: "Suscripción Cancelada",
            description: "Has cancelado el proceso de suscripción.",
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
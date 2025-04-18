import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Subscription } from '@/types/subscription';

export const useSubscription = () => {
  const fetchSubscription = async (): Promise<Subscription> => {
    try {
      const supabase = createClientComponentClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[useSubscription] Error al obtener la sesión:', sessionError);
        throw new Error('Error al obtener la sesión');
      }

      if (!session) {
        console.log('[useSubscription] No hay sesión activa');
        throw new Error('No hay sesión activa');
      }

      console.log('[useSubscription] Sesión encontrada:', {
        userId: session.user.id,
        userEmail: session.user.email
      });

      const response = await fetch('/api/v1/subscriptions/current', {
        credentials: 'include',
      });

      const responseData = await response.json();
      console.log('[useSubscription] Respuesta completa del servidor:', responseData);
    
      if (!response.ok) {
        console.error('[useSubscription] Error en respuesta del servidor:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        if (response.status === 404) {
          // Actualizar el estado de la suscripción en la base de datos
          const { data: currentSub, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();

          console.log('[useSubscription] Búsqueda en Supabase:', {
            encontrado: !!currentSub,
            error: subError,
            datos: currentSub
          });

          if (currentSub) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString()
              })
              .eq('id', currentSub.id);

            console.log('[useSubscription] Actualización en Supabase:', {
              error: updateError
            });
          }

          // Retornar una suscripción gratuita con el tipo correcto
          return {
            id: currentSub?.id || 'free',
            user_id: session.user.id,
            paypal_subscription_id: null,
            plan_type: 'free',
            plan_interval: 'monthly',
            plan_currency: 'USD',
            plan_value: 0,
            plan_features: ['Plan Gratuito'],
            status: 'expired',
            payment_method: 'none',
            current_period_starts_at: new Date().toISOString(),
            current_period_ends_at: new Date().toISOString(),
            trial_ends_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            cancel_at_period_end: false,
            metadata: {}
          };
        }
        
        throw new Error(responseData.detail || 'Error al obtener la información de suscripción');
      }

      // Convertir la respuesta al tipo Subscription correcto
      const subscription: Subscription = {
        id: responseData.id,
        user_id: responseData.user_id,
        paypal_subscription_id: responseData.paypal_subscription_id || null,
        plan_type: responseData.plan_type,
        plan_interval: responseData.plan_interval,
        plan_currency: responseData.plan_currency,
        plan_value: Number(responseData.plan_value || 0),
        plan_features: Array.isArray(responseData.plan_features) ? responseData.plan_features : [],
        status: responseData.status,
        payment_method: responseData.payment_method || 'PayPal',
        current_period_starts_at: responseData.current_period_starts_at,
        current_period_ends_at: responseData.current_period_ends_at,
        trial_ends_at: responseData.trial_ends_at || null,
        created_at: responseData.created_at,
        updated_at: responseData.updated_at,
        cancel_at_period_end: responseData.cancel_at_period_end || false,
        metadata: responseData.metadata || {}
      };

      console.log('[useSubscription] Datos de suscripción procesados:', subscription);

      return subscription;
    } catch (error) {
      console.error('[useSubscription] Error en fetchSubscription:', error);
      throw error;
    }
  };

  return useQuery<Subscription, Error>({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
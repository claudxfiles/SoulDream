import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Subscription {
  id: string;
  paypal_subscription_id: string | null;
  plan_value: number;
  member_since: string;
  plan_type: string;
  plan_interval: string;
  plan_currency: string;
  plan_status: string;
  subscription_date: string;
  plan_validity_end: string | null;
  plan_features: string[];
  status: string;
  payment_method?: string;
}

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
                status: 'not_found',
                updated_at: new Date().toISOString()
              })
              .eq('id', currentSub.id);

            console.log('[useSubscription] Actualización en Supabase:', {
              error: updateError
            });
          }

          console.log('[useSubscription] Retornando plan gratuito');
          return {
            id: currentSub?.id || 'free',
            paypal_subscription_id: null,
            status: 'not_found',
            plan_type: 'free',
            plan_interval: 'monthly',
            plan_currency: 'USD',
            plan_value: 0,
            plan_status: 'active',
            member_since: new Date().toISOString(),
            subscription_date: new Date().toISOString(),
            plan_validity_end: null,
            plan_features: ['Plan Gratuito'],
            payment_method: 'none'
          };
        }
        
        throw new Error(responseData.detail || 'Error al obtener la información de suscripción');
      }

      // Aquí está el problema: la respuesta del servidor no está enviando los campos correctamente
      // Modificamos para asegurar que todos los campos estén disponibles, usando valores por defecto si es necesario
      const subscription: Subscription = {
        // Si estos campos no están presentes o son undefined, usamos valores por defecto
        id: responseData.id || `temp-${new Date().getTime()}`,
        paypal_subscription_id: responseData.paypal_subscription_id || null,
        plan_value: Number(responseData.plan_value || 0),
        member_since: responseData.member_since || new Date().toISOString(),
        plan_type: responseData.plan_type || 'Unknown',
        plan_interval: responseData.plan_interval || 'monthly',
        plan_currency: responseData.plan_currency || 'USD',
        plan_status: responseData.plan_status || 'unknown',
        subscription_date: responseData.subscription_date || new Date().toISOString(),
        plan_validity_end: responseData.plan_validity_end || null,
        plan_features: Array.isArray(responseData.plan_features) ? responseData.plan_features : [],
        // Usar status o plan_status como fallback
        status: responseData.status || responseData.plan_status || 'unknown',
        payment_method: responseData.payment_method || 'PayPal'
      };

      console.log('[useSubscription] Datos de suscripción procesados:', {
        id: subscription.id,
        paypalId: subscription.paypal_subscription_id,
        status: subscription.status,
        planType: subscription.plan_type,
        allData: subscription
      });

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
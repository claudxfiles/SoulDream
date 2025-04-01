import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Subscription {
  id: string;
  paypal_subscription_id: string;
  status: 'active' | 'cancelled' | 'pending';
  plan_type: string;
  plan_interval: string;
  plan_currency: string;
  plan_value: number;
  plan_status: string;
  member_since: string;
  plan_validity_end: string | null;
  plan_features: string[];
  payment_method?: string;
}

export const useSubscription = () => {
  const fetchSubscription = async (): Promise<Subscription> => {
    try {
      const supabase = createClientComponentClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error al obtener la sesión:', sessionError);
        throw new Error('Error al obtener la sesión');
      }

      if (!session) {
        console.log('No hay sesión activa');
        throw new Error('No hay sesión activa');
      }

      console.log('Sesión encontrada, obteniendo suscripción...');

      const response = await fetch('/api/v1/subscriptions/current', {
        credentials: 'include',
      });
    
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Error en la respuesta:', error);
        throw new Error(error.error || 'Error al obtener la información de suscripción');
      }
    
      const data = await response.json();
      console.log('Datos de suscripción obtenidos:', data);
      return data;
    } catch (error) {
      console.error('Error en fetchSubscription:', error);
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
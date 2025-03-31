'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';

interface Subscription {
  id: string;
  paypal_subscription_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plan: {
    name: string;
    description: string;
    price: number;
    currency: string;
    billing_interval: string;
  };
}

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/subscription/manage');
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            id,
            paypal_subscription_id,
            status,
            current_period_end,
            cancel_at_period_end,
            subscription_plan:subscription_plan_id (
              name,
              description,
              price,
              currency,
              billing_interval
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          const formattedData = {
            ...data,
            subscription_plan: Array.isArray(data.subscription_plan) 
              ? data.subscription_plan[0] 
              : data.subscription_plan
          };
          setSubscription(formattedData as Subscription);
        }
      } catch (error: any) {
        console.error('Error fetching subscription:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información de la suscripción.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, supabase, router, toast]);

  const handleCancelSubscription = async () => {
    if (!subscription?.paypal_subscription_id) return;

    try {
      setCancelling(true);
      const response = await fetch('/api/paypal/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.paypal_subscription_id,
          reason: 'Cancelled by user',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la suscripción');
      }

      toast({
        title: 'Suscripción Cancelada',
        description: 'Tu suscripción ha sido cancelada exitosamente.',
      });

      router.refresh();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Sin Suscripción Activa</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No tienes una suscripción activa en este momento.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/profile/subscription')}
            className="w-full"
          >
            Ver Planes Disponibles
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Tu Suscripción</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{subscription.subscription_plan.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{subscription.subscription_plan.description}</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Estado</span>
              <span className={`font-medium ${
                subscription.status === 'active' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {subscription.status === 'active' ? 'Activa' : 'Pendiente'}
              </span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Precio</span>
              <span className="font-medium">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: subscription.subscription_plan.currency
                }).format(subscription.subscription_plan.price)}
                /{subscription.subscription_plan.billing_interval === 'month' ? 'mes' : 'año'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Próxima facturación</span>
              <span className="font-medium">
                {new Date(subscription.current_period_end).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <div className="border-t pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Cancelar Suscripción'}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Tu suscripción seguirá activa hasta el final del período facturado.
              </p>
            </div>
          )}

          {subscription.cancel_at_period_end && (
            <div className="border-t pt-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Tu suscripción ha sido cancelada y finalizará el {new Date(subscription.current_period_end).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}.
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/profile/subscription/history')}
            >
              Ver Historial de Pagos
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 
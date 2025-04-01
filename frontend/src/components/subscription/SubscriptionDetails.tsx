import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, X, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const SubscriptionDetails = () => {
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleManageSubscription = () => {
    router.push('/dashboard/profile/subscription');
  };

  const handleViewHistory = () => {
    router.push('/dashboard/profile/subscription/history');
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.paypal_subscription_id) return;

    try {
      setIsCancelling(true);
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

      refetch();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg">
        <p className="text-destructive">
          Error al cargar la información de suscripción
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1D24] p-6 rounded-lg">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1A1D24] p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{subscription.plan_type}</h3>
              <p className="text-gray-400 text-sm">Facturación {subscription.plan_interval}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: subscription.plan_currency,
                }).format(subscription.plan_value)}
                <span className="text-sm text-gray-400">/mes</span>
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-gray-400 text-sm">Estado</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p>{subscription.plan_status === 'active' ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Inicio del plan</p>
                <p>{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Características incluidas:</p>
              <ul className="space-y-2">
                {subscription.plan_features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1D24] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Detalles de la cuenta</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Miembro desde</p>
              <p>{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Próxima facturación</p>
              <p>{subscription.plan_validity_end 
                ? format(new Date(subscription.plan_validity_end), 'PP', { locale: es })
                : 'No disponible'}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Método de pago</p>
              <p>{subscription.payment_method || 'PayPal'}</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button 
                className="w-full bg-white text-black hover:bg-gray-200"
                onClick={handleManageSubscription}
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Suscripción
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-[#1A1D24] text-white border-none hover:bg-[#2A2D34]"
                onClick={handleViewHistory}
              >
                <Clock className="w-4 h-4 mr-2" />
                Historial
              </Button>
              <Button 
                variant="destructive" 
                className="w-full bg-[#3A1618] text-red-500 hover:bg-[#4A2628]"
                onClick={handleCancelSubscription}
                disabled={isCancelling || subscription.status !== 'active'}
              >
                <X className="w-4 h-4 mr-2" />
                {isCancelling ? 'Cancelando...' : 'Cancelar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
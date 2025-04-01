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
    <div className="bg-[#0f172a] p-6 rounded-lg">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#0f172a] p-6 rounded-lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{subscription.plan_type}</h3>
              <p className="text-gray-400 text-sm">Facturación {subscription.plan_interval}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold text-white">
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
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <p className="text-white">{subscription.plan_status === 'active' ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Inicio del plan</p>
                <p className="text-white">{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Características incluidas:</p>
              <ul className="space-y-2">
                {subscription.plan_features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-white">
                    <svg className="w-4 h-4 text-[#10b981]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-white">Detalles de la cuenta</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Miembro desde</p>
              <p className="text-white">{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Próxima facturación</p>
              <p className="text-white">{subscription.plan_validity_end 
                ? format(new Date(subscription.plan_validity_end), 'PP', { locale: es })
                : 'No disponible'}</p>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Método de pago</p>
              <p className="text-white">{subscription.payment_method || 'PayPal'}</p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button 
                className="w-full bg-[#4f46e5] text-white hover:bg-[#4f46e5]/90"
                onClick={handleManageSubscription}
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Suscripción
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-[#0f172a] text-white border-[#4f46e5] hover:bg-[#4f46e5]/10"
                onClick={handleViewHistory}
              >
                <Clock className="w-4 h-4 mr-2" />
                Historial
              </Button>
              <Button 
                variant="destructive" 
                className="w-full bg-red-900/20 text-red-500 hover:bg-red-900/30"
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
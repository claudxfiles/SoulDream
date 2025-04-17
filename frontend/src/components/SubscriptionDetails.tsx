import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SubscriptionDetails() {
  const router = useRouter();
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      console.log('[SubscriptionDetails] Iniciando cancelación de suscripción:', {
        subscriptionId: subscription?.id,
        paypalSubscriptionId: subscription?.paypal_subscription_id,
        status: subscription?.status
      });

      if (!subscription?.id && !subscription?.paypal_subscription_id) {
        console.error('[SubscriptionDetails] No se encontró ID de suscripción');
        toast.error('No se pudo encontrar la información de suscripción');
        return;
      }

      setIsCancelling(true);

      const response = await fetch('/api/v1/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.paypal_subscription_id || subscription.id,
        }),
      });

      const data = await response.json();
      console.log('[SubscriptionDetails] Respuesta de cancelación:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Error al cancelar la suscripción');
      }

      toast.success('Suscripción cancelada exitosamente');
      await refetch();
      router.refresh();
    } catch (error) {
      console.error('[SubscriptionDetails] Error al cancelar suscripción:', error);
      toast.error('Error al cancelar la suscripción. Por favor intenta de nuevo.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <div>Cargando información de suscripción...</div>;
  }

  if (error) {
    console.error('[SubscriptionDetails] Error al cargar suscripción:', error);
    return (
      <div>Error al cargar la información de suscripción. Por favor recarga la página.</div>
    );
  }

  if (!subscription) {
    return <div>No se encontró información de suscripción.</div>;
  }

  const isActive = subscription.status === 'active' || subscription.plan_status === 'active';
  const planName = subscription.plan_type === 'free' ? 'Plan Gratuito' : `Plan ${subscription.plan_type}`;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Detalles de Suscripción</h2>
      <div className="space-y-4">
        <div>
          <p className="font-semibold">Plan Actual:</p>
          <p>{planName}</p>
        </div>
        <div>
          <p className="font-semibold">Estado:</p>
          <p>{isActive ? 'Activo' : 'Inactivo'}</p>
        </div>
        <div>
          <p className="font-semibold">Precio:</p>
          <p>{subscription.plan_value} {subscription.plan_currency}</p>
        </div>
        <div>
          <p className="font-semibold">Método de Pago:</p>
          <p>{subscription.payment_method || 'No especificado'}</p>
        </div>
        <div>
          <p className="font-semibold">Fecha de Inicio:</p>
          <p>{new Date(subscription.subscription_date).toLocaleDateString()}</p>
        </div>
        {subscription.plan_validity_end && (
          <div>
            <p className="font-semibold">Válido Hasta:</p>
            <p>{new Date(subscription.plan_validity_end).toLocaleDateString()}</p>
          </div>
        )}
        <div>
          <p className="font-semibold">Características:</p>
          <ul className="list-disc list-inside">
            {subscription.plan_features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
        {isActive && subscription.plan_type !== 'free' && (
          <Button
            onClick={handleCancelSubscription}
            disabled={isCancelling}
            variant="destructive"
            className="w-full mt-4"
          >
            {isCancelling ? 'Cancelando...' : 'Cancelar Suscripción'}
          </Button>
        )}
      </div>
    </Card>
  );
} 
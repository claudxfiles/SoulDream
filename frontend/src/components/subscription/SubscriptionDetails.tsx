import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, X, Settings, CreditCard, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';

export const SubscriptionDetails = () => {
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Log subscription data when it changes
  useEffect(() => {
    if (subscription) {
      console.log('[SubscriptionDetails] Datos de suscripción actuales:', {
        id: subscription.id,
        paypalId: subscription.paypal_subscription_id,
        status: subscription.status,
        planType: subscription.plan_type,
        allData: subscription
      });
    }
  }, [subscription]);

  const handleManageSubscription = () => {
    router.push('/dashboard/profile/subscription');
  };

  const handleViewHistory = () => {
    router.push('/dashboard/profile/subscription/history');
  };

  const handleCancelSubscription = async () => {
    console.log('[SubscriptionDetails] Iniciando proceso de cancelación:', {
      subscriptionId: subscription?.id,
      paypalSubscriptionId: subscription?.paypal_subscription_id,
      status: subscription?.status
    });

    if (!subscription?.id || !subscription?.paypal_subscription_id) {
      console.error('[SubscriptionDetails] Faltan IDs necesarios:', {
        id: subscription?.id,
        paypalId: subscription?.paypal_subscription_id
      });
      toast({
        title: 'Error',
        description: 'No se encontró la información de suscripción. Contacta a soporte.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCancelling(true);
      console.log('[SubscriptionDetails] Enviando solicitud de cancelación:', {
        subscriptionId: subscription.id,
        paypalSubscriptionId: subscription.paypal_subscription_id
      });
      
      // Call our cancellation endpoint
      const response = await fetch(`/api/v1/subscriptions/${subscription.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_period_end: true,
          cancellation_reason: 'User requested cancellation'
        }),
      });

      console.log('[SubscriptionDetails] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText
      });
      
      const responseData = await response.json();
      console.log('[SubscriptionDetails] Datos de respuesta:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Error al cancelar la suscripción');
      }

      toast({
        title: 'Suscripción Cancelada',
        description: 'Tu suscripción se cancelará al final del período actual.',
      });

      setShowConfirmDialog(false);
      refetch();
    } catch (error) {
      console.error('[SubscriptionDetails] Error en cancelación:', {
        error,
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cancelar la suscripción. Por favor intenta nuevamente.',
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
    <>
      <div className="bg-white dark:bg-[#0f172a] rounded-xl shadow-lg border border-gray-200 dark:border-[#4f46e5]/10 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Columna izquierda - Detalles del plan */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white dark:from-[#0f172a] dark:to-[#1e293b]">
            <div className="space-y-1 mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{subscription.plan_type}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Facturación {subscription.plan_interval}</p>
            </div>
            
            <div className="flex items-baseline mb-6">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: subscription.plan_currency,
              }).format(subscription.plan_value)}</span>
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">US$/mes</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Activo</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Inicio del plan</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {subscription.plan_features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#4f46e5]" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha - Detalles de la cuenta */}
          <div className="p-8 bg-white dark:bg-[#0f172a]">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Detalles de la cuenta</h4>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(subscription.member_since), 'PP', { locale: es })}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Próxima facturación</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{subscription.plan_validity_end 
                  ? format(new Date(subscription.plan_validity_end), 'PP', { locale: es })
                  : 'No disponible'}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Método de pago</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#4f46e5]" />
                  {subscription.payment_method || 'PayPal'}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleManageSubscription}
                className="w-full bg-[#4f46e5] text-white hover:bg-[#4f46e5]/90 transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Suscripción
              </Button>
              
              <Button
                variant="outline"
                onClick={handleViewHistory}
                className="w-full border-gray-200 dark:border-[#4f46e5]/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#4f46e5]/10"
              >
                <Clock className="h-4 w-4 mr-2" />
                Historial
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowConfirmDialog(true)}
                className="w-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                disabled={isCancelling}
              >
                <X className="h-4 w-4 mr-2" />
                {isCancelling ? 'Cancelando...' : 'Cancelar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de que deseas cancelar tu suscripción?</DialogTitle>
            <DialogDescription>
              Tu suscripción permanecerá activa hasta el final del período actual.
              Después de eso, perderás acceso a todas las funciones premium.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isCancelling}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelando...' : 'Sí, cancelar suscripción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 
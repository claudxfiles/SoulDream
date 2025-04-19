import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, X, Settings, CreditCard, CheckCircle2, RefreshCw, PauseCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { format, differenceInDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subscription } from '@/types/subscription';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// Función de utilidad para formatear fechas de manera segura
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No disponible';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';
};

// Función para calcular días restantes
const calculateDaysLeft = (endDate: string | null | undefined): number => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  if (!isValid(end)) return 0;
  return Math.max(0, differenceInDays(end, new Date()));
};

export const SubscriptionDetails = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { data: subscription, isLoading, error, refetch } = useSubscription();
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showNewSubscriptionDialog, setShowNewSubscriptionDialog] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const isSubscriptionActive = subscription?.status === 'active';
  const isSuspended = subscription?.status === 'suspended';
  const isCancelled = subscription?.status === 'cancelled' || subscription?.cancel_at_period_end;
  const canReactivate = isSuspended || isCancelled;
  const periodEndsAt = subscription?.current_period_ends_at;

  const now = new Date();
  const isTrialActive = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > now;
  
  const trialDaysLeft = subscription?.trial_ends_at ? 
    calculateDaysLeft(subscription.trial_ends_at) : 0;

  // Log subscription data when it changes
  useEffect(() => {
    if (subscription) {
      console.log('[SubscriptionDetails] Datos de suscripción actuales:', {
        id: subscription.id,
        paypalId: subscription.paypal_subscription_id,
        status: subscription.status,
        planType: subscription.plan_type,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodEndsAt: subscription.current_period_ends_at,
        allData: subscription
      });
    }
  }, [subscription]);

  const handleManageSubscription = () => {
    router.push('/dashboard/profile/subscription');
  };

  const handleViewHistory = () => {
    router.push('/dashboard/profile/history');
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.paypal_subscription_id) {
      toast({
        title: 'Error',
        description: 'No se encontró la información de suscripción.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsReactivating(true);
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.paypal_subscription_id,
        }),
      });

      const data = await response.json();

      if (data.action === 'CREATE_NEW') {
        setShowReactivateDialog(false);
        setShowNewSubscriptionDialog(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al reactivar la suscripción');
      }

      toast({
        title: 'Suscripción Reactivada',
        description: 'Tu suscripción ha sido reactivada exitosamente.',
      });

      setShowReactivateDialog(false);
      refetch();
    } catch (error) {
      console.error('[SubscriptionDetails] Error en reactivación:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al reactivar la suscripción',
        variant: 'destructive',
      });
    } finally {
      setIsReactivating(false);
    }
  };

  const handleSuspendSubscription = async () => {
    if (!subscription?.paypal_subscription_id) {
      toast({
        title: 'Error',
        description: 'No se encontró la información de suscripción.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSuspending(true);
      const response = await fetch('/api/subscriptions/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.paypal_subscription_id,
          reason: 'User requested suspension'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.status && data.status !== 'active') {
          throw new Error(`No se puede suspender la suscripción porque está en estado: ${data.status}`);
        }
        throw new Error(data.error || 'Error al suspender la suscripción');
      }

      toast({
        title: 'Suscripción Suspendida',
        description: 'Tu suscripción ha sido suspendida exitosamente. Puedes reactivarla cuando lo desees.',
      });

      setShowSuspendDialog(false);
      refetch();
    } catch (error) {
      console.error('[SubscriptionDetails] Error en suspensión:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al suspender la suscripción',
        variant: 'destructive',
      });
    } finally {
      setIsSuspending(false);
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
        <p className="text-destructive">Error al cargar la información de suscripción</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Facturación {subscription.plan_interval}
                {isTrialActive && (
                  <span className="ml-2 text-emerald-500">
                    (Período de prueba: {trialDaysLeft} días restantes)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-baseline mb-6">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: subscription.plan_currency,
                }).format(subscription.plan_value)}
              </span>
              <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">US$/mes</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isSubscriptionActive ? 'bg-emerald-400' : 'bg-yellow-400'}`}></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {isSubscriptionActive ? 'Activo' : isCancelled ? 'Cancelado' : 'Inactivo'}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isCancelled ? 'Acceso hasta' : 'Próxima facturación'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription?.current_period_ends_at)}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {subscription.plan_features?.map((feature, index) => (
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription?.created_at)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isCancelled ? 'Acceso hasta' : 'Próxima facturación'}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription?.current_period_ends_at)}
                </p>
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

              {/* Botón de Reactivar si está suspendida o cancelada */}
              {canReactivate && (
                <Button
                  variant="outline"
                  onClick={() => setShowReactivateDialog(true)}
                  className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  disabled={isReactivating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isReactivating ? 'Reactivando...' : 'Reactivar Suscripción'}
                </Button>
              )}

              {/* Botón de Suspender solo si está activa y no cancelada */}
              {isSubscriptionActive && !isCancelled && !isSuspended && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuspendDialog(true)}
                  className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  disabled={isSuspending}
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  {isSuspending ? 'Suspendiendo...' : 'Suspender Suscripción'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Reactivación */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Deseas reactivar tu suscripción?</DialogTitle>
            <DialogDescription>
              Tu suscripción se reactivará inmediatamente y continuará con la facturación normal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReactivateDialog(false)}
              disabled={isReactivating}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleReactivateSubscription}
              disabled={isReactivating}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isReactivating ? 'Reactivando...' : 'Sí, reactivar suscripción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Nueva Suscripción */}
      <Dialog open={showNewSubscriptionDialog} onOpenChange={setShowNewSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Suscripción</DialogTitle>
            <DialogDescription>
              Tu suscripción anterior fue cancelada. Necesitas crear una nueva suscripción para continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewSubscriptionDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShowNewSubscriptionDialog(false);
                router.push('/dashboard/profile/subscription');
              }}
              className="bg-[#4f46e5] hover:bg-[#4f46e5]/90"
            >
              Crear Nueva Suscripción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Suspensión */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Deseas suspender tu suscripción?</DialogTitle>
            <DialogDescription>
              Tu suscripción será suspendida temporalmente. Podrás reactivarla en cualquier momento.
              Durante la suspensión, tu suscripción permanecerá activa hasta el final del período actual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
              disabled={isSuspending}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSuspendSubscription}
              disabled={isSuspending}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isSuspending ? 'Suspendiendo...' : 'Sí, suspender suscripción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 
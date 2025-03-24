'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Icons } from '@/components/shared/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function loadData() {
      const subscriptionService = SubscriptionService.getInstance();
      
      try {
        // Cargar suscripción actual
        const currentSubscription = await subscriptionService.getCurrentSubscription();
        setSubscription(currentSubscription);
        
        if (currentSubscription) {
          // Cargar detalles del plan
          const plans = await subscriptionService.getSubscriptionPlans();
          const currentPlan = plans.find(p => p.id === currentSubscription.plan_id);
          setPlan(currentPlan);
          
          // Cargar historial de pagos
          const history = await subscriptionService.getPaymentHistory();
          setPaymentHistory(history);
        }
      } catch (error) {
        console.error('Error al cargar información de suscripción:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de tu suscripción",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium al final de tu período de facturación.')) {
      return;
    }
    
    setIsCancelling(true);
    try {
      const subscriptionService = SubscriptionService.getInstance();
      await subscriptionService.cancelSubscription();
      
      toast({
        title: "Suscripción Cancelada",
        description: "Tu suscripción se ha cancelado correctamente. Tendrás acceso a las funciones premium hasta el final del período actual.",
      });
      
      // Recargar la suscripción
      const currentSubscription = await subscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);
    } catch (error: any) {
      console.error('Error al cancelar suscripción:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cancelar la suscripción",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const renderSubscriptionStatus = () => {
    if (!subscription) return null;
    
    if (subscription.status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
          Activa
        </span>
      );
    } else if (subscription.status === 'cancelled' && subscription.cancel_at_period_end) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400">
          Cancelada (acceso hasta fin de período)
        </span>
      );
    } else if (subscription.status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400">
          Cancelada
        </span>
      );
    } else if (subscription.status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400">
          Pendiente
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
        {subscription.status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información de suscripción...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Gestionar Suscripción</CardTitle>
            <CardDescription>No tienes una suscripción activa actualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              No encontramos ninguna suscripción activa asociada a tu cuenta. Explora nuestros planes y elige el que mejor se adapte a tus necesidades.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/subscription')}>
              Ver Planes Disponibles
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gestionar Suscripción</h1>
          <p className="text-muted-foreground">
            Administra tu suscripción y consulta tu historial de pagos
          </p>
        </div>

        <div className="grid gap-6">
          {/* Detalles de suscripción */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detalles de tu Plan</CardTitle>
                  <CardDescription>Información sobre tu suscripción actual</CardDescription>
                </div>
                {renderSubscriptionStatus()}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Plan</h3>
                    <p className="text-lg font-semibold">{plan?.name || 'Plan Premium'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Precio</h3>
                    <p className="text-lg font-semibold">
                      {plan?.price === 0 
                        ? 'Gratis' 
                        : `$${plan?.price || '0'} / ${plan?.interval === 'month' ? 'mes' : 'año'}`}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Fecha de inicio</h3>
                    <p>
                      {subscription.current_period_start 
                        ? format(new Date(subscription.current_period_start), 'PPP', { locale: es })
                        : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Próxima facturación</h3>
                    <p>
                      {subscription.current_period_end
                        ? format(new Date(subscription.current_period_end), 'PPP', { locale: es })
                        : 'No disponible'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Método de pago</h3>
                  <div className="flex items-center space-x-2">
                    <Icons.credit className="h-5 w-5 text-muted-foreground" />
                    <p>{subscription.payment_provider === 'paypal' ? 'PayPal' : 'Método de pago predeterminado'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button 
                variant="outline"
                onClick={() => router.push('/subscription')}
              >
                Cambiar Plan
              </Button>
              {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                <Button 
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Cancelar Suscripción
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Historial de pagos */}
          {paymentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Registro de tus pagos anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3">Fecha</th>
                        <th scope="col" className="px-4 py-3">Monto</th>
                        <th scope="col" className="px-4 py-3">Estado</th>
                        <th scope="col" className="px-4 py-3">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="px-4 py-3">
                            {format(new Date(payment.created_at), 'PPP', { locale: es })}
                          </td>
                          <td className="px-4 py-3">
                            ${payment.amount} {payment.currency}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400'
                            }`}>
                              {payment.status === 'completed' ? 'Completado' : payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {payment.payment_method === 'paypal' ? 'PayPal' : payment.payment_method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
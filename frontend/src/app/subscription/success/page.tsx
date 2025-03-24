'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SubscriptionService } from '@/services/subscription.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/shared/icons';
import { toast } from '@/components/ui/use-toast';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const confirmSubscription = async () => {
      const subscriptionId = searchParams.get('subscription_id');
      
      if (!subscriptionId) {
        setHasError(true);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "No se encontró información de la suscripción",
          variant: "destructive"
        });
        return;
      }
      
      try {
        // Confirmar la suscripción en nuestra base de datos
        const subscriptionService = SubscriptionService.getInstance();
        const subscription = await subscriptionService.confirmSubscription(subscriptionId);
        
        // Obtener el nombre del plan
        if (subscription.plan_id) {
          const plans = await subscriptionService.getSubscriptionPlans();
          const plan = plans.find(p => p.id === subscription.plan_id);
          if (plan) {
            setPlanName(plan.name);
          }
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error al confirmar suscripción:', error);
        setHasError(true);
        setIsLoading(false);
        toast({
          title: "Error",
          description: error.message || "Error al confirmar la suscripción",
          variant: "destructive"
        });
      }
    };
    
    confirmSubscription();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center">
              <Icons.spinner className="h-8 w-8 animate-spin mb-4" />
              <CardTitle>Confirmando tu suscripción</CardTitle>
              <CardDescription className="mt-2">
                Estamos procesando tu suscripción, por favor espera un momento...
              </CardDescription>
            </div>
          ) : hasError ? (
            <>
              <div className="mx-auto mb-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <Icons.alert className="h-8 w-8" />
              </div>
              <CardTitle>Error en la suscripción</CardTitle>
              <CardDescription className="mt-2">
                Ha ocurrido un error al procesar tu suscripción. Por favor, inténtalo nuevamente o contacta a soporte.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                <Icons.check className="h-8 w-8" />
              </div>
              <CardTitle>¡Suscripción Exitosa!</CardTitle>
              <CardDescription className="mt-2">
                Tu suscripción al plan {planName || 'Premium'} ha sido confirmada. ¡Gracias por confiar en SoulDream!
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {!isLoading && (
          <CardContent className="text-center">
            {hasError ? (
              <p className="text-muted-foreground">
                Si el problema persiste, por favor contacta a nuestro equipo de soporte para asistencia.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Ahora tienes acceso a todas las funcionalidades premium de la plataforma. Te invitamos a explorar todas las nuevas características disponibles.
              </p>
            )}
          </CardContent>
        )}
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            disabled={isLoading}
          >
            Ir al Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
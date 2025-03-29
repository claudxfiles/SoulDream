import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Subscription {
  id: string;
  status: string;
  plan_name: string;
  current_period_end: string;
  price: number;
  interval: string;
}

export function SubscriptionManager({ subscription }: { subscription: Subscription }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason: 'Cancelled by user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción se ha cancelado correctamente.',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowCancelDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold">{subscription.plan_name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Estado: <span className="capitalize">{subscription.status}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Próxima facturación: {formatDate(subscription.current_period_end)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Precio: ${subscription.price}/{subscription.interval}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading || subscription.status === 'cancelled'}
          >
            {isLoading ? 'Procesando...' : 'Cancelar suscripción'}
          </Button>
        </div>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará tu suscripción al final del período actual.
              Podrás seguir usando el servicio hasta {formatDate(subscription.current_period_end)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription}>
              Confirmar cancelación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 
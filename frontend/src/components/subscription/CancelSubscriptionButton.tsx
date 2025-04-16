'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  onCancelled?: () => void;
}

export function CancelSubscriptionButton({ subscriptionId, onCancelled }: CancelSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      // Llamar a nuestra API para cancelar la suscripción en PayPal
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cancelar la suscripción');
      }

      // Actualizar el estado en Supabase
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceling',
          cancel_at_period_end: true,
        })
        .eq('subscription_id', subscriptionId);

      if (updateError) {
        throw updateError;
      }

      // Registrar el evento de cancelación
      await supabase.from('subscription_events').insert({
        subscription_id: subscriptionId,
        event_type: 'subscription_cancellation_requested',
        metadata: {
          cancelled_at: new Date().toISOString(),
        },
      });

      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción se cancelará al final del período actual.',
      });

      onCancelled?.();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error al cancelar la suscripción:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar la suscripción. Por favor, intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirmDialog(true)}
        className="w-full"
      >
        Cancelar Suscripción
      </Button>

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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelando...' : 'Sí, cancelar suscripción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 
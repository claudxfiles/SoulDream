'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';

export function SubscriptionPlans() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const showToasts = () => {
      // Show success message if redirected from successful subscription
      if (searchParams?.get('success') === 'true') {
        toast({
          title: '¡Suscripción Exitosa!',
          description: 'Tu suscripción ha sido activada correctamente.',
        });
      }

      // Show cancelled message if user cancelled the subscription process
      if (searchParams?.get('cancelled') === 'true') {
        toast({
          title: 'Suscripción Cancelada',
          description: 'Has cancelado el proceso de suscripción.',
          variant: 'destructive',
        });
      }
    };

    showToasts();
  }, [searchParams, toast]);

  const handleSubscribe = async (planId: string) => {
    try {
      if (!user) {
        router.push('/auth/login?redirect=/subscription');
        return;
      }

      setLoading(true);

      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar la suscripción');
      }

      const data = await response.json();
      window.location.href = data.approvalUrl;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo iniciar la suscripción. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Plan Mensual</h3>
        <div className="mb-4">
          <p className="text-3xl font-bold">$9.99</p>
          <p className="text-gray-600 dark:text-gray-400">por mes</p>
        </div>
        <ul className="space-y-2 mb-6">
          <li>✓ Acceso a todas las funciones</li>
          <li>✓ Soporte prioritario</li>
          <li>✓ Sin anuncios</li>
        </ul>
        <Button
          className="w-full"
          onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID!)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Suscribirse'
          )}
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Plan Anual</h3>
        <div className="mb-4">
          <p className="text-3xl font-bold">$99.99</p>
          <p className="text-gray-600 dark:text-gray-400">por año</p>
          <p className="text-sm text-green-600 font-medium">¡Ahorra 16%!</p>
        </div>
        <ul className="space-y-2 mb-6">
          <li>✓ Acceso a todas las funciones</li>
          <li>✓ Soporte prioritario</li>
          <li>✓ Sin anuncios</li>
          <li>✓ 2 meses gratis</li>
        </ul>
        <Button
          className="w-full"
          onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_YEAR_ID!)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            'Suscribirse'
          )}
        </Button>
      </Card>
    </div>
  );
} 
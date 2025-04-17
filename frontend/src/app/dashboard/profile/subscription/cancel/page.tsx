'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir al dashboard después de 5 segundos
    const timer = setTimeout(() => {
      router.push('/dashboard/profile/subscription');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suscripción Cancelada
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Has cancelado el proceso de suscripción. Si tienes alguna pregunta o necesitas ayuda,
            no dudes en contactarnos.
          </p>
          <Button
            onClick={() => router.push('/dashboard/profile/subscription')}
            className="mt-4"
          >
            Volver a Suscripciones
          </Button>
        </div>
      </Card>
    </div>
  );
} 
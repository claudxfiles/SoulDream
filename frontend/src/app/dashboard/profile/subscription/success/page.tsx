'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
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
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ¡Suscripción Exitosa!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Tu suscripción ha sido activada correctamente. Ahora tienes acceso a todas las funciones premium.
          </p>
          <Button
            onClick={() => router.push('/dashboard/profile/subscription')}
            className="mt-4"
          >
            Ir a Mi Suscripción
          </Button>
        </div>
      </Card>
    </div>
  );
} 
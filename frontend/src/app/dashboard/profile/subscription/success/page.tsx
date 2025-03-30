'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    toast({
      title: "¡Suscripción exitosa!",
      description: "Tu suscripción ha sido activada correctamente.",
    });
    
    // Redirigir al dashboard después de 3 segundos
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">¡Gracias por tu suscripción!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Tu suscripción ha sido procesada correctamente. Serás redirigido al dashboard en unos segundos...
        </p>
      </div>
    </div>
  );
} 
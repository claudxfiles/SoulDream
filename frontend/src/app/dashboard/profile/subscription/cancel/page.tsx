'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  useEffect(() => {
    toast({
      title: "Suscripción cancelada",
      description: "Has cancelado el proceso de suscripción.",
      variant: "destructive",
    });
    
    // Redirigir a la página de suscripción después de 3 segundos
    const timeout = setTimeout(() => {
      router.push('/dashboard/profile/subscription');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Suscripción Cancelada</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Has cancelado el proceso de suscripción. Serás redirigido a la página de suscripción en unos segundos...
        </p>
      </div>
    </div>
  );
} 
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const updateSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Actualizar el estado de la suscripción a activo
      await supabase
        .from('subscriptions')
        .update({ status: 'ACTIVE' })
        .eq('user_id', session.user.id)
        .eq('status', 'APPROVAL_PENDING');
    };

    updateSubscription();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-2xl font-bold">¡Suscripción Exitosa!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tu suscripción ha sido activada correctamente. Ahora puedes disfrutar de todas las funcionalidades premium.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push('/dashboard')}
        >
          Ir al Dashboard
        </Button>
      </Card>
    </div>
  );
} 
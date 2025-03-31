'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const cleanupPendingSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Eliminar la suscripción pendiente
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('status', 'APPROVAL_PENDING');
    };

    cleanupPendingSubscription();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Suscripción Cancelada</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Has cancelado el proceso de suscripción. Puedes intentarlo nuevamente cuando lo desees.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push('/dashboard/profile/subscription')}
        >
          Volver a Planes
        </Button>
      </Card>
    </div>
  );
} 
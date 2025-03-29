import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PlanSelector } from '@/components/subscription/PlanSelector';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';

export default async function ManageSubscriptionPage() {
  const supabase = createServerComponentClient({ cookies });

  // Verificar autenticación
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  // Obtener la suscripción activa del usuario
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', session.user.id)
    .eq('status', 'ACTIVE')
    .single();

  // Obtener todos los planes disponibles
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price');

  if (!plans) {
    throw new Error('No se pudieron cargar los planes de suscripción');
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Plan de suscripción</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa y gestiona tu plan de suscripción actual
        </p>
      </div>

      {subscription ? (
        <div className="space-y-8">
          <SubscriptionManager subscription={subscription} />
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Cambiar plan</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Actualiza o cambia tu plan de suscripción actual
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Selecciona un plan</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
      )}

      <PlanSelector plans={plans} currentPlan={subscription?.subscription_plans} />
    </div>
  );
} 
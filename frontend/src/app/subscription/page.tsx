import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Planes y Precios | SoulDream',
  description: 'Elige el plan que mejor se adapte a tus necesidades y potencia tu productividad con SoulDream.',
};

export default async function SubscriptionPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price');
    
  if (error) {
    console.error('Error loading subscription plans:', error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error cargando los planes de suscripción</p>
      </div>
    );
  }

  return (
    <div className="py-24 sm:py-32">
      <SubscriptionPlans plans={plans} />
    </div>
  );
} 
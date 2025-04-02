'use client';

import { useEffect, useState } from 'react';
import { PricingPlan } from '@/components/subscription/PricingPlan';
import { createClientComponent } from '@/lib/supabase';

const plans = [
  {
    id: 'free_plan',
    name: 'Free',
    price: 0,
    description: 'Para usuarios que buscan productividad personal básica',
    interval: 'mes',
    buttonText: 'Comenzar gratis',
    features: [
      { name: 'Hasta 10 tareas activas', included: true },
      { name: '3 hábitos personalizados', included: true },
      { name: 'Acceso al calendario básico', included: true },
      { name: 'Gestión financiera básica', included: true },
      { name: 'Asistente IA personalizado', included: false },
      { name: 'Integración con Google Calendar', included: false },
      { name: 'Capacidad de proyectos ilimitada', included: false },
      { name: 'Prioridad en el soporte técnico', included: false },
    ],
  },
  {
    id: 'P-5ML4271244454362XMVZEWLY',
    name: 'Pro',
    price: 9.99,
    description: 'Para usuarios que buscan productividad avanzada',
    interval: 'mes',
    buttonText: 'Actualizar a Pro',
    features: [
      { name: 'Tareas ilimitadas', included: true },
      { name: 'Hábitos ilimitados', included: true },
      { name: 'Gestión financiera completa', included: true },
      { name: 'Asistente IA personalizado', included: true },
      { name: 'Integración con Google Calendar', included: true },
      { name: 'Seguimiento de metas avanzado', included: true },
      { name: 'Analítica personalizada', included: true },
      { name: 'Prioridad en el soporte técnico', included: false },
    ],
    popular: true,
  },
  {
    id: 'P-5ML4271244454362XMVZEWLZ',
    name: 'Premium',
    price: 19.99,
    description: 'Para equipos y empresas que buscan máxima productividad',
    interval: 'mes',
    buttonText: 'Actualizar a Premium',
    features: [
      { name: 'Todo lo incluido en Pro', included: true },
      { name: 'Plantillas de productividad', included: true },
      { name: 'Capacidad de proyectos ilimitada', included: true },
      { name: 'Prioridad en el soporte técnico', included: true },
      { name: 'Características exclusivas anticipadas', included: true },
      { name: 'Consultoría personalizada', included: true },
      { name: 'API acceso completo', included: true },
      { name: 'Características empresariales', included: true },
    ],
  },
];

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserTier = async () => {
      const supabase = createClientComponent();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setCurrentTier(data.subscription_tier);
        }
      }
    };

    fetchUserTier();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    // Aquí iría la lógica para manejar la selección del plan
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Planes y Precios</h1>
        <p className="text-xl text-muted-foreground">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <PricingPlan
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentTier === plan.id}
            isLoading={isLoading}
            onSelectPlan={handleSelectPlan}
          />
        ))}
      </div>
    </div>
  );
} 
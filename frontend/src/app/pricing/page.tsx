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
      'Hasta 10 tareas activas',
      '3 hábitos personalizados',
      'Acceso al calendario básico',
      'Gestión financiera básica',
      'Asistente IA básico',
      'Calendario básico',
      'Analítica básica',
      'Soporte estándar'
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
      'Tareas ilimitadas',
      'Hábitos ilimitados',
      'Gestión financiera completa',
      'Asistente IA personalizado',
      'Integración con Google Calendar',
      'Seguimiento de metas avanzado',
      'Analítica personalizada',
      'Soporte prioritario'
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
      'Todo lo incluido en Pro',
      'Plantillas de productividad',
      'Proyectos ilimitados',
      'Soporte prioritario 24/7',
      'Acceso anticipado a nuevas funciones',
      'Consultoría personalizada',
      'API acceso completo',
      'Características empresariales'
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
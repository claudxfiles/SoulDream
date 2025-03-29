'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { PricingPlan } from './PricingPlan';
import { SubscriptionService, SubscriptionPlan, Subscription } from '@/services/subscription.service';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface FeatureItem {
  name: string;
  included: boolean;
}

// Features por plan
const planFeatures = {
  free: [
    { name: 'Hasta 10 tareas', included: true },
    { name: 'Seguimiento de 3 hábitos', included: true },
    { name: 'Asistente IA básico', included: true },
    { name: 'Gestión financiera limitada', included: true },
    { name: 'Sin publicidad', included: true },
    { name: 'Calendario básico', included: true },
    { name: 'Sin analítica avanzada', included: false },
    { name: 'Sin workout personalizado', included: false }
  ],
  premium: [
    { name: 'Tareas ilimitadas', included: true },
    { name: 'Hábitos ilimitados', included: true },
    { name: 'Asistente IA avanzado', included: true },
    { name: 'Gestión financiera completa', included: true },
    { name: 'Sin publicidad', included: true },
    { name: 'Integración con Google Calendar', included: true },
    { name: 'Analítica personalizada', included: true },
    { name: 'Planes de workout personalizados', included: true }
  ],
  business: [
    { name: 'Todo lo de Premium', included: true },
    { name: 'Hasta 5 usuarios', included: true },
    { name: 'Dashboard compartido', included: true },
    { name: 'Metas de equipo', included: true },
    { name: 'Reportes avanzados', included: true },
    { name: 'API para integraciones', included: true },
    { name: 'Asistente IA personalizado', included: true },
    { name: 'Soporte prioritario', included: true }
  ]
};

export function PricingPlans() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);

  const subscriptionService = SubscriptionService.getInstance();

  useEffect(() => {
    async function loadData() {
      try {
        const currentSubscription = await subscriptionService.getCurrentSubscription();
        setCurrentSub(currentSubscription);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    try {
      const { approvalUrl } = await subscriptionService.startSubscription(planId);
      window.location.href = approvalUrl;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la suscripción",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      description: 'Perfecto para comenzar a organizar tu vida de manera básica.',
      features: planFeatures.free,
      buttonText: 'Comenzar gratis',
      interval: isAnnual ? 'año' : 'mes'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: isAnnual ? 14.99 : 14.99,
      description: 'Todas las herramientas para organizar tu vida personal de manera eficiente.',
      features: planFeatures.premium,
      buttonText: 'Comenzar Premium',
      popular: true,
      interval: isAnnual ? 'año' : 'mes'
    },
    {
      id: 'business',
      name: 'Negocios',
      price: isAnnual ? 34.99 : 34.99,
      description: 'Ideal para empresarios y profesionales que necesitan gestionar todo su ecosistema.',
      features: planFeatures.business,
      buttonText: 'Contactar ventas',
      interval: isAnnual ? 'año' : 'mes'
    }
  ];

  return (
    <div className="py-24 px-4 md:px-8">
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="rounded-full px-4 py-1">
          Precios
        </Badge>
        <h2 className="text-4xl font-bold">
          Planes para cada necesidad
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comienza gratis y actualiza a medida que creces. Cancela en cualquier momento.
        </p>

        <div className="flex items-center justify-center gap-2 pt-4">
          <span className={`text-sm ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensual</span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <span className={`text-sm flex items-center gap-2 ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Anual
            {isAnnual && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                Ahorra 33%
              </Badge>
            )}
          </span>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <PricingPlan
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentSub?.plan_id === plan.id}
            onSelectPlan={handleSelectPlan}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
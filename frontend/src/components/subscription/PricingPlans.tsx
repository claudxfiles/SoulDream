'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { PricingPlan } from './PricingPlan';
import { SubscriptionService, SubscriptionPlan, Subscription } from '@/services/subscription.service';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';

interface FeatureItem {
  name: string;
}

// Features por nivel para cada plan
const planFeatures: Record<string, FeatureItem[]> = {
  'Free': [
    { name: 'Gestión de tareas básicas' },
    { name: 'Hasta 3 metas activas' }, 
    { name: 'Seguimiento de 5 hábitos' },
    { name: 'Vista de calendario básica' },
    { name: 'Analítica básica' }
  ],
  'Pro': [
    { name: 'Gestión de tareas ilimitadas' },
    { name: 'Hasta 15 metas activas' },
    { name: 'Seguimiento de hábitos ilimitados' },
    { name: 'Integración con Google Calendar' },
    { name: 'Asistente IA para productividad' },
    { name: 'Seguimiento financiero básico' },
    { name: 'Analítica avanzada' }
  ],
  'Business': [
    { name: 'Todas las características de Pro' },
    { name: 'Metas y tareas ilimitadas' },
    { name: 'Gestión financiera avanzada' },
    { name: 'Plan de activos financieros' },
    { name: 'Asistente IA personalizado' },
    { name: 'Recomendaciones avanzadas de IA' },
    { name: 'Prioridad en soporte' },
    { name: 'Analítica premium' }
  ]
};

export function PricingPlans() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const subscriptionService = SubscriptionService.getInstance();

  // Cargar planes y suscripción actual
  useEffect(() => {
    async function loadData() {
      try {
        const [plansData, currentSubscription] = await Promise.all([
          subscriptionService.getSubscriptionPlans(),
          subscriptionService.getCurrentSubscription()
        ]);
        
        // Agregar features a los planes (en un entorno real, esto vendría de la base de datos)
        const plansWithFeatures = plansData.map((plan: SubscriptionPlan) => {
          if (plan.name === 'Free') {
            return { ...plan, features: planFeatures.Free };
          } else if (plan.name === 'Pro') {
            return { ...plan, features: planFeatures.Pro };
          } else if (plan.name === 'Business') {
            return { ...plan, features: planFeatures.Business };
          }
          return plan;
        });
        
        setPlans(plansWithFeatures);
        setCurrentSub(currentSubscription);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes de suscripción",
          variant: "destructive"
        });
      }
    }
    
    loadData();
  }, []);

  // Filtrar planes por intervalo de facturación
  const filteredPlans = plans.filter(plan => 
    plan.interval === billingInterval || plan.price === 0
  );

  // Manejar selección de plan
  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    try {
      // Iniciar proceso de suscripción
      const { approvalUrl } = await subscriptionService.startSubscription(planId);
      
      // Redirigir a PayPal para completar el pago
      window.location.href = approvalUrl;
    } catch (error: any) {
      console.error('Error al seleccionar plan:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar la suscripción",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cancelación de suscripción
  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a las funciones premium al final de tu período de facturación.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await subscriptionService.cancelSubscription();
      
      toast({
        title: "Suscripción Cancelada",
        description: "Tu suscripción se ha cancelado correctamente.",
      });
      
      // Recargar los datos
      const currentSubscription = await subscriptionService.getCurrentSubscription();
      setCurrentSub(currentSubscription);
    } catch (error: any) {
      console.error('Error al cancelar suscripción:', error);
      toast({
        title: "Error",
        description: error.message || "Error al cancelar la suscripción",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Planes y Precios
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Elige el plan que mejor se adapte a tus necesidades y potencia tu productividad con SoulDream.
        </p>
        
        {/* Selector de intervalo de facturación */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <Button
              variant={billingInterval === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('month')}
              className="rounded-md"
            >
              Mensual
            </Button>
            <Button
              variant={billingInterval === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingInterval('year')}
              className="rounded-md"
            >
              Anual <span className="ml-1 text-xs opacity-75">-20%</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mostrar información de suscripción actual */}
      {currentSub && currentSub.status === 'active' && (
        <div className="mb-8 p-4 bg-muted/50 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-medium text-lg mb-2">Tu suscripción actual</h3>
          <p className="mb-4">
            Estás suscrito al plan {currentSub.plan_id.split('-')[0]}.
            {currentSub.current_period_end && (
              <span> Tu próximo pago será el {new Date(currentSub.current_period_end).toLocaleDateString()}.</span>
            )}
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelSubscription}
            disabled={isLoading}
          >
            {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancelar suscripción
          </Button>
        </div>
      )}

      {/* Grid de planes */}
      {plans.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <PricingPlan
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentSub?.plan_id === plan.id}
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-10">
          <Icons.spinner className="h-10 w-10 animate-spin" />
        </div>
      )}
    </div>
  );
} 
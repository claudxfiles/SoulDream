'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, AlertCircle, Crown, Zap, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Feature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: (string | Feature)[];
  paypal_plan_id: string | null;
  highlighted?: boolean;
  badge?: string;
}

const features = [
  'Gestión de tareas, metas y hábitos',
  'Asistente IA personalizado 24/7',
  'Gestión financiera completa',
  'Integración con Google Calendar',
  'Analítica avanzada y reportes',
  'Plan de activos financieros',
  'Workout personalizado con IA',
  'Soporte prioritario'
];

export function SubscriptionSettings() {
  const { profile, user, updateProfile } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data: plansData, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price');

        if (error) throw error;

        // Transformar los planes y agregar propiedades de UI
        const formattedPlans = plansData.map(plan => ({
          ...plan,
          highlighted: plan.name === 'Pro',
          badge: plan.name === 'Pro' ? 'Popular' : undefined,
          features: Array.isArray(plan.features) 
            ? plan.features.map((feature: any) => {
                if (typeof feature === 'string') return feature;
                if (typeof feature === 'object' && feature !== null) {
                  return feature.name;
                }
                return '';
              }).filter(Boolean)
            : []
        }));

        setPlans(formattedPlans);
      } catch (error) {
        console.error('Error al cargar los planes:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los planes de suscripción',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [supabase]);

  const currentPlan = plans.find(plan => plan.id === (profile?.subscription_tier || 'free'));

  const handleUpgrade = async (planId: string) => {
    if (planId === profile?.subscription_tier) {
      return;
    }

    try {
      setIsChangingPlan(true);

      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la suscripción');
      }

      if (data.approvalUrl) {
        // Redirigir a PayPal para completar la suscripción
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No se recibió la URL de aprobación');
      }

    } catch (error: any) {
      console.error('Error al actualizar el plan:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar tu plan. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.subscription_id) {
      return;
    }

    try {
      setIsChangingPlan(true);

      const response = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subscriptionId: profile.subscription_id,
          reason: 'Cancelled by user'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la suscripción');
      }

      await updateProfile({
        subscription_tier: 'free',
        subscription_id: null
      });

      toast({
        title: 'Suscripción cancelada',
        description: 'Tu suscripción ha sido cancelada exitosamente',
      });

    } catch (error: any) {
      console.error('Error al cancelar la suscripción:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar tu suscripción. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const planPrice = isAnnual ? '120' : '14.99';
  const planInterval = isAnnual ? 'year' : 'month';

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="text-white hover:text-white/80"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Button>
        </div>

        {/* Título de la sección */}
        <h1 className="text-2xl font-bold mb-8">Plan de suscripción</h1>

        {/* Descripción y gestión */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Gestionar Plan</h2>
          <p className="text-gray-400">
            Revisa y gestiona tu plan de suscripción actual
          </p>
        </div>

        {/* Toggle Anual/Mensual */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <span className={`text-sm ${isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>
            Anual
          </span>
          <button 
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAnnual ? 'bg-indigo-600' : 'bg-gray-600'}`}
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <span className="sr-only">Cambiar plan</span>
            <span 
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <span className={`text-sm flex items-center gap-2 ${!isAnnual ? 'text-white font-medium' : 'text-gray-400'}`}>
            Mensual
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              Ahorra 33.3%
            </span>
          </span>
        </div>

        {/* Plan */}
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-6">
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400">
                Popular
              </span>
            </div>

            <h3 className="text-lg font-semibold mb-4">Pro</h3>
            <div className="flex items-baseline mb-4">
              <span className="text-4xl font-bold">{planPrice}</span>
              <span className="ml-1 text-gray-400">USD/{planInterval}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Desbloquea todo el potencial de SoulDream con funciones ilimitadas y prueba gratuita de 7 días
            </p>

            <ul className="space-y-3 mb-6">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="mr-2 h-5 w-5 flex-shrink-0 text-indigo-500" />
                  <span className="text-sm text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              className="w-full py-3 px-4 rounded-lg bg-gray-700 text-gray-400 cursor-not-allowed"
              disabled
            >
              No disponible
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
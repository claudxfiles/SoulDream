'use client';

import React, { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, AlertCircle, Crown, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    description: 'Para uso personal básico',
    features: [
      'Hasta 10 tareas activas',
      '5 hábitos personalizados',
      'Registro básico de finanzas',
      'Acceso al calendario básico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9.99€/mes',
    description: 'Para usuarios que buscan productividad avanzada',
    features: [
      'Tareas ilimitadas',
      'Hábitos ilimitados',
      'Gestión financiera completa',
      'Seguimiento de metas avanzado',
      'Asistente IA personalizado',
      'Integración con Google Calendar',
    ],
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: 'business',
    name: 'Business',
    price: '19.99€/mes',
    description: 'Para profesionales y equipos pequeños',
    features: [
      'Todo lo incluido en Pro',
      'Acceso API completo',
      'Plantillas de productividad personalizadas',
      'Capacidad de exportación avanzada',
      'Prioridad en el soporte técnico',
      'Características exclusivas anticipadas',
    ],
  },
];

export function SubscriptionSettings() {
  const { profile, user, updateProfile, isUpdatingProfile } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string>(profile?.subscription_tier || 'free');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  
  const currentPlan = PLANS.find(plan => plan.id === (profile?.subscription_tier || 'free'));
  
  const handleUpgrade = async (planId: string) => {
    if (planId === profile?.subscription_tier) {
      return;
    }
    
    // Aquí iría la integración real con PayPal u otro sistema de pagos
    // Para este ejemplo, solo actualizamos el perfil
    
    try {
      setIsChangingPlan(true);
      // Simulamos el proceso de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await updateProfile({
        subscription_tier: planId as 'free' | 'pro' | 'business',
      });
      
      toast({
        title: 'Plan actualizado',
        description: `Tu suscripción ha sido actualizada al plan ${planId.toUpperCase()}`,
        variant: 'default',
      });
      
      setSelectedPlan(planId);
    } catch (error) {
      console.error('Error al actualizar el plan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar tu plan. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Tu plan actual</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gestiona tu suscripción y método de pago
        </p>
      </div>
      
      {currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  {currentPlan.id === 'free' ? (
                    <Zap className="mr-2 h-5 w-5 text-blue-500" />
                  ) : currentPlan.id === 'pro' ? (
                    <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                  ) : (
                    <Crown className="mr-2 h-5 w-5 text-purple-500" />
                  )}
                  Plan {currentPlan.name}
                </CardTitle>
                <CardDescription>{currentPlan.description}</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm font-medium">
                {currentPlan.price}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          {profile?.subscription_tier !== 'free' && (
            <CardFooter className="flex flex-col items-start space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Facturación mensual vía PayPal</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Próximo cobro: 15 de abril de 2024
              </div>
              <Button variant="outline" className="mt-2" size="sm">
                Cancelar suscripción
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      
      <Separator className="my-6" />
      
      <div>
        <h3 className="text-lg font-medium">Cambiar plan</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Actualiza o cambia tu plan de suscripción actual
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.highlighted ? 'border-primary shadow-md' : ''}`}>
            {plan.badge && (
              <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-primary">
                {plan.badge}
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="text-2xl font-bold mt-2">{plan.price}</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.highlighted ? 'default' : 'outline'}
                disabled={isChangingPlan || plan.id === profile?.subscription_tier}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isChangingPlan && selectedPlan === plan.id ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Procesando...
                  </>
                ) : plan.id === profile?.subscription_tier ? (
                  'Plan actual'
                ) : (
                  `Cambiar a ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mt-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Información importante</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Los cambios en tu plan de suscripción se aplicarán inmediatamente. Si bajas de categoría, 
                mantendrás acceso a las funcionalidades premium hasta el final del período de facturación actual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
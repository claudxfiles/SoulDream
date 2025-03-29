import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  paypal_plan_id: string | null;
}

interface PlanSelectorProps {
  plans: Plan[];
  currentPlan?: Plan;
}

export function PlanSelector({ plans, currentPlan }: PlanSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    console.log('Iniciando proceso de suscripción para el plan:', planId);
    setIsLoading(true);

    try {
      console.log('Enviando solicitud a /api/subscription...');
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      console.log('Respuesta recibida:', response.status);
      const data = await response.json();
      console.log('Datos de respuesta:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la suscripción');
      }

      if (data.approvalUrl) {
        console.log('URL de aprobación recibida:', data.approvalUrl);
        console.log('Redirigiendo a PayPal...');
        window.location.href = data.approvalUrl;
      } else {
        console.error('No se recibió URL de aprobación en la respuesta');
        throw new Error('No se recibió URL de aprobación');
      }
    } catch (error: any) {
      console.error('Error en el proceso de suscripción:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan?.id === plan.id;
        const isFreePlan = plan.price === 0;

        return (
          <Card key={plan.id} className={`p-6 ${isCurrentPlan ? 'border-primary' : ''}`}>
            <div className="flex flex-col h-full">
              <div>
                {isCurrentPlan && (
                  <Badge className="mb-4" variant="outline">
                    Plan Actual
                  </Badge>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {isFreePlan ? 'Gratis' : `$${plan.price}`}
                  </span>
                  {!isFreePlan && (
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.interval}
                    </span>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t">
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || isCurrentPlan || (isFreePlan && currentPlan)}
                  variant={isCurrentPlan ? 'outline' : 'default'}
                >
                  {isLoading
                    ? 'Procesando...'
                    : isCurrentPlan
                    ? 'Plan Actual'
                    : isFreePlan
                    ? 'Usar Plan Gratuito'
                    : 'Suscribirse'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { paypalService } from '@/lib/paypal';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlanProps {
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  planId: string;
  currentTier?: string;
  isPopular?: boolean;
}

export function PricingPlan({
  name,
  price,
  description,
  features,
  planId,
  currentTier,
  isPopular = false,
}: PricingPlanProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { subscriptionId, status, error } = await paypalService.createSubscription(planId);

      if (error || status === 'error') {
        throw new Error(error || 'Error al procesar la suscripción');
      }

      // Redirigir a la página de éxito con el ID de suscripción
      router.push(`/subscription/success?subscriptionId=${subscriptionId}`);
    } catch (error) {
      console.error('Error en la suscripción:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar la suscripción',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentPlan = currentTier?.toLowerCase() === name.toLowerCase();

  return (
    <Card className={`w-full max-w-sm ${isPopular ? 'border-primary shadow-lg' : ''}`}>
      <CardHeader>
        {isPopular && (
          <div className="px-3 py-1 text-sm text-primary-foreground bg-primary rounded-full w-fit mb-4">
            Más Popular
          </div>
        )}
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground">/mes</span>
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className={`h-5 w-5 mr-2 ${feature.included ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isLoading || isCurrentPlan}
          onClick={handleSubscribe}
        >
          {isLoading ? 'Procesando...' : isCurrentPlan ? 'Plan Actual' : 'Suscribirse'}
        </Button>
      </CardFooter>
    </Card>
  );
} 
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
}

interface PricingPlanProps {
  plan: Plan;
  isCurrentPlan: boolean;
  isLoading: boolean;
  onSelectPlan: (planId: string) => void;
}

export function PricingPlan({
  plan,
  isCurrentPlan,
  isLoading,
  onSelectPlan,
}: PricingPlanProps) {
  return (
    <Card className={`relative flex flex-col justify-between overflow-hidden ${
      plan.popular 
        ? 'border-primary shadow-lg shadow-primary/10' 
        : 'border-border'
    }`}>
      {plan.popular && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl bg-primary text-primary-foreground px-3 py-1">
            Más popular
          </Badge>
        </div>
      )}
      
      <div>
        <CardHeader className="pb-8">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            <CardDescription className="text-base">
              {plan.description}
            </CardDescription>
          </div>
          <div className="mt-4 flex items-baseline text-5xl font-extrabold">
            {plan.price === 0 ? (
              'Gratis'
            ) : (
              <>
                €{plan.price}
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  /{plan.interval}
                </span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </div>

      <CardFooter className="pt-8">
        <Button
          className={`w-full ${
            plan.popular
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-secondary hover:bg-secondary/90'
          }`}
          disabled={isLoading || isCurrentPlan}
          onClick={() => onSelectPlan(plan.id)}
        >
          {isLoading 
            ? 'Procesando...' 
            : isCurrentPlan 
            ? 'Plan Actual' 
            : plan.buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
} 
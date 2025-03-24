'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/services/subscription.service";
import { cn } from "@/lib/utils";

interface PricingPlanProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

export function PricingPlan({ 
  plan, 
  isCurrentPlan, 
  onSelectPlan, 
  isLoading 
}: PricingPlanProps) {
  // Convertir las características del plan (JSONB) a un array
  const features = Array.isArray(plan.features) ? plan.features : [];

  // Determinar la clase para destacar el plan actual o recomendado
  const isHighlighted = isCurrentPlan || plan.name === 'Pro';
  
  return (
    <Card className={cn(
      "flex flex-col",
      isHighlighted && "border-primary shadow-lg"
    )}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {plan.name}
          {isCurrentPlan && (
            <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-100 py-1 px-2 rounded-full">
              Plan Actual
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-sm mt-2">
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <span className="text-3xl font-bold">
            {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-muted-foreground text-sm ml-1">
              /{plan.interval === 'month' ? 'mes' : 'año'}
            </span>
          )}
        </div>
        
        <ul className="space-y-2 mt-6">
          {features.map((feature: any, index: number) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm">{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onSelectPlan(plan.id)}
          variant={isCurrentPlan ? "outline" : isHighlighted ? "default" : "secondary"}
          className="w-full"
          disabled={isCurrentPlan || isLoading}
        >
          {isCurrentPlan ? 'Plan Actual' : isLoading ? 'Procesando...' : `Seleccionar ${plan.name}`}
        </Button>
      </CardFooter>
    </Card>
  );
} 
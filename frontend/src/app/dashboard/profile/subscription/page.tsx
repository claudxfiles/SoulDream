'use client';

import { useState } from "react";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlyPlan = {
    name: "Pro",
    price: "14.99",
    interval: "mes",
    description: "Desbloquea todo el potencial de SoulDream con funciones ilimitadas y prueba gratuita de 7 días",
    features: [
      "Tareas, metas y hábitos ilimitados",
      "Asistente IA personalizado 24/7",
      "Gestión financiera completa",
      "Integración con Google Calendar",
      "Analítica avanzada y reportes",
      "Plan de activos financieros",
      "Workout personalizado con IA",
      "Soporte prioritario"
    ],
    planId: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID || 'P-1H048096T5545353AM7U2EQQ'
  };

  const annualPlan = {
    ...monthlyPlan,
    price: "120",
    interval: "año",
    planId: process.env.NEXT_PUBLIC_PAYPAL_PRO_ANNUAL_PLAN_ID || 'P-25P774007P7890240M7U2DTA'
  };

  const activePlan = isAnnual ? annualPlan : monthlyPlan;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Plan de suscripción</h1>
        
        <div className="flex justify-center items-center gap-4 mb-8">
          <Label htmlFor="billing-toggle" className={!isAnnual ? "font-bold" : "text-muted-foreground"}>Mensual</Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? "font-bold" : "text-muted-foreground"}>
            Anual <span className="text-sm text-emerald-600">(¡Ahorra 33%!)</span>
          </Label>
        </div>

        <div className="flex justify-center">
          <PricingCard
            popular={true}
            name={activePlan.name}
            price={activePlan.price}
            interval={activePlan.interval}
            description={activePlan.description}
            features={activePlan.features}
            planId={activePlan.planId}
          />
        </div>
      </div>
    </div>
  );
} 
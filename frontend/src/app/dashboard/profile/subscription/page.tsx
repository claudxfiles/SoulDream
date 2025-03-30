'use client';

import { PricingCard } from "@/components/subscription/PricingCard";

export default function SubscriptionPage() {
  const proPlan = {
    name: "Pro",
    price: "14.99",
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
    planId: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID || 'P-5ML4271244454362WXNWU5NQ'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Plan de suscripción</h1>
        <div className="flex justify-center">
          <PricingCard
            popular={true}
            name={proPlan.name}
            price={proPlan.price}
            description={proPlan.description}
            features={proPlan.features}
            planId={proPlan.planId}
          />
        </div>
      </div>
    </div>
  );
} 
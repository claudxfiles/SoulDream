'use client';

import { useState } from "react";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, CreditCard } from "lucide-react";

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlyPlan = {
    name: "Pro",
    price: "14.99",
    interval: "mes",
    description: "Desbloquea todo el potencial de SoulDream AI para transformar tu vida con gestión personal inteligente y automatizada",
    features: [
      "Gestión ilimitada de tareas y metas con IA",
      "Seguimiento de hábitos personalizado",
      "Sistema completo de gestión financiera",
      "Planificador de workout con IA",
      "Asistente personal IA 24/7",
      "Analítica avanzada multidimensional",
      "Integración con Google Calendar",
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Potencia tu Desarrollo Personal
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Unifica la gestión de todos los aspectos de tu vida en una sola plataforma potenciada por IA. Organiza tus metas, hábitos, finanzas y fitness de manera inteligente.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-6 mb-12 bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm max-w-md mx-auto">
            <Label 
              htmlFor="billing-toggle" 
              className={`flex items-center gap-2 cursor-pointer transition-colors ${!isAnnual ? "text-primary font-semibold" : "text-gray-500 dark:text-gray-400"}`}
            >
              <CreditCard className="w-4 h-4" />
              Mensual
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <Label 
              htmlFor="billing-toggle" 
              className={`flex items-center gap-2 cursor-pointer transition-colors ${isAnnual ? "text-primary font-semibold" : "text-gray-500 dark:text-gray-400"}`}
            >
              <span className="flex items-center gap-2">
                Anual
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                  ¡Ahorra 33%!
                </span>
              </span>
            </Label>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center">
            <div className="transform hover:scale-105 transition-transform duration-300">
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

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <div className="flex justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pago 100% Seguro
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                7 Días de Prueba
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Cancela Cuando Quieras
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from "react";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, CreditCard, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SubscriptionPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

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

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "¡Suscripción Activada!",
        description: "Tu suscripción ha sido activada correctamente. ¡Disfruta de todas las funcionalidades premium!",
      });
    }
  }, [success]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Sección de Gestión */}
          {success !== 'true' && (
            <div className="mb-16 animate-fade-in">
              <div className="flex items-center mb-6">
                <Link href="/dashboard/profile">
                  <Button variant="ghost" size="lg" className="gap-2 hover:bg-primary/10">
                    <ArrowLeft className="w-5 h-5" />
                    Volver a mi Perfil
                  </Button>
                </Link>
              </div>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 mb-16">
                <h1 className="text-2xl font-bold mb-4">Gestionar Suscripción</h1>
                {/* Contenido de gestión de suscripción */}
              </Card>
            </div>
          )}

          {/* Header Section */}
          <div className="text-center mb-16 space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 backdrop-blur-sm">
              <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              Potencia tu Desarrollo Personal
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Unifica la gestión de todos los aspectos de tu vida en una sola plataforma potenciada por IA. Organiza tus metas, hábitos, finanzas y fitness de manera inteligente.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-8 mb-16 bg-card/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg max-w-md mx-auto border border-border/50 animate-fade-up">
            <Label 
              htmlFor="billing-toggle" 
              className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${!isAnnual ? "text-primary font-semibold scale-105" : "text-muted-foreground hover:text-primary"}`}
            >
              <CreditCard className="w-5 h-5" />
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
              className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${isAnnual ? "text-primary font-semibold scale-105" : "text-muted-foreground hover:text-primary"}`}
            >
              <span className="flex items-center gap-2">
                Anual
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-bounce">
                  -33%
                </span>
              </span>
            </Label>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center mb-16 animate-fade-up delay-150">
            <div className="transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl">
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
          <div className="mt-16 text-center animate-fade-up delay-300">
            <div className="inline-flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Pago 100% Seguro
              </div>
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                7 Días de Prueba
              </div>
              <div className="flex items-center gap-3 transition-colors hover:text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Cancela Cuando Quieras
              </div>
            </div>
          </div>

          {success === 'true' && (
            <div className="mt-16 text-center animate-fade-up delay-200">
              <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-border/50">
                <div className="flex justify-center mb-8">
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold mb-4">
                  ¡Suscripción Activada con Éxito!
                </h1>
                
                <p className="text-muted-foreground mb-8 text-lg">
                  Tu suscripción ha sido activada correctamente. Ya puedes disfrutar de todas las funcionalidades premium de SoulDream AI.
                </p>

                <div className="space-x-4">
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2">
                      <ArrowLeft className="w-5 h-5" />
                      Ir al Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
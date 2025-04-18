'use client';

import { useState, useEffect, Suspense } from "react";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, CreditCard, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function SubscriptionContent() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hadPreviousTrial, setHadPreviousTrial] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSuccess = searchParams.get('success') === 'true';
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  // Verificar si es un usuario nuevo y si ya tuvo trial
  useEffect(() => {
    async function checkUserStatus() {
      console.log('🔍 Iniciando verificación de estado del usuario...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('❌ No hay sesión activa');
          setIsLoading(false);
          return;
        }
        console.log('✅ Sesión encontrada:', session.user.id);

        // Verificar TANTO en subscriptions como en trial_usage
        const [subscriptionsResponse, trialUsageResponse] = await Promise.all([
          supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .not('trial_ends_at', 'is', null),
          supabase
            .from('trial_usage')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('trial_used', true)
        ]);

        console.log('🔍 Resultados de búsqueda:', {
          subscriptions: subscriptionsResponse.data,
          trialUsage: trialUsageResponse.data
        });

        const hadTrialInSubscriptions = subscriptionsResponse.data && subscriptionsResponse.data.length > 0;
        const hadTrialInUsage = trialUsageResponse.data && trialUsageResponse.data.length > 0;
        
        const isNew = !hadTrialInSubscriptions && !hadTrialInUsage;
        console.log('👤 Estado del usuario:', { isNew, hadTrialInSubscriptions, hadTrialInUsage });
        setIsNewUser(isNew);
        setHadPreviousTrial(!isNew);
        
        if (isNew) {
          console.log('🎉 Usuario nuevo detectado, activando trial...');
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);

          // Insertar en ambas tablas
          const [subscriptionInsert, trialUsageInsert] = await Promise.all([
            supabase
              .from('subscriptions')
              .insert({
                user_id: session.user.id,
                status: 'active',
                trial_ends_at: trialEndDate.toISOString(),
                current_period_starts_at: new Date().toISOString(),
                current_period_ends_at: trialEndDate.toISOString(),
                plan_id: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID_FREE_TRIAL
              }),
            supabase
              .from('trial_usage')
              .insert({
                user_id: session.user.id,
                trial_used: false,
                trial_start_date: new Date().toISOString(),
                trial_end_date: trialEndDate.toISOString()
              })
          ]);

          if (subscriptionInsert.error || trialUsageInsert.error) {
            console.error('❌ Error al activar trial:', {
              subscriptionError: subscriptionInsert.error,
              trialUsageError: trialUsageInsert.error
            });
          } else {
            console.log('✅ Trial activado correctamente');
            toast({
              title: "¡Bienvenido a SoulDream!",
              description: "Tu período de prueba gratuito de 7 días ha sido activado.",
            });
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error general al verificar estado:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkUserStatus();
  }, [supabase, router, toast]);

  // Verificar suscripción activa al cargar la página
  useEffect(() => {
    async function checkSubscription() {
      console.log('🔍 Verificando suscripción activa...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('❌ No hay sesión para verificar suscripción');
          setIsLoading(false);
          return;
        }

        // Obtener la suscripción del usuario
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active');

        console.log('📊 Suscripciones activas encontradas:', { subscriptions, error });

        if (error) {
          console.error('❌ Error al consultar suscripciones:', error);
          setIsLoading(false);
          return;
        }

        // Si tiene suscripción activa y no estamos en la página de éxito, redirigir
        if (subscriptions && subscriptions.length > 0 && !isSuccess) {
          console.log('✅ Suscripción activa encontrada, redirigiendo...');
          router.push('/dashboard/profile/subscription?success=true');
        }
      } catch (error) {
        console.error('❌ Error al verificar suscripción:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [router, isSuccess]);

  const monthlyPlan = {
    name: "Pro",
    price: 14.99,
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
    planId: isNewUser 
      ? process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID_FREE_TRIAL 
      : process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID
  };

  const annualPlan = {
    ...monthlyPlan,
    price: 120,
    interval: "año",
    planId: isNewUser 
      ? process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_YEAR_ID_FREE_TRIAL 
      : process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_YEAR_ID
  };

  const activePlan = isAnnual ? annualPlan : monthlyPlan;

  // Modificar el plan si es usuario nuevo
  const displayPlan = {
    ...activePlan,
    trial: isNewUser,
    trialDays: isNewUser ? 7 : undefined,
    description: isNewUser 
      ? "Comienza tu prueba gratuita de 7 días. Sin compromiso, cancela cuando quieras."
      : activePlan.description,
    callToAction: isNewUser ? "Comenzar prueba gratis" : "Suscribirse ahora",
    priceAfterTrial: isNewUser ? `$${activePlan.price}/${activePlan.interval} después del trial` : undefined
  };

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "¡Suscripción Activada!",
        description: "Tu suscripción ha sido activada correctamente. ¡Disfruta de todas las funcionalidades premium!",
      });
    }
  }, [isSuccess, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="flex flex-col items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-emerald-500" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ¡Suscripción Activada con Éxito!
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Gracias por confiar en SoulDream. Estamos emocionados de tenerte como miembro premium y ayudarte a alcanzar tus metas personales.
              </p>
              
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-emerald-700 dark:text-emerald-300">
                  Tu plan premium está activo y puedes comenzar a disfrutar de todos los beneficios inmediatamente.
                </p>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button asChild>
                  <Link href="/dashboard">
                    Ir al Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/profile">
                    Ver mi Perfil
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Sección de Gestión */}
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

          {/* Header Section */}
          <div className="text-center mb-16 space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 backdrop-blur-sm">
              <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              {isNewUser ? '¡Bienvenido a SoulDream!' : (hadPreviousTrial ? 'Continúa tu experiencia premium' : 'Potencia tu Desarrollo Personal')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {isNewUser 
                ? '¡Prueba todas las funciones premium gratis durante 7 días! Sin compromiso, cancela cuando quieras.'
                : (hadPreviousTrial 
                  ? 'Ya has disfrutado de tu período de prueba. Elige el plan que mejor se adapte a tus necesidades.'
                  : 'Unifica la gestión de todos los aspectos de tu vida en una sola plataforma potenciada por IA.')}
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
                name={displayPlan.name}
                price={displayPlan.price}
                interval={displayPlan.interval}
                description={displayPlan.description}
                features={displayPlan.features}
                planId={displayPlan.planId || ''}
                trial={displayPlan.trial}
                trialDays={displayPlan.trialDays}
                priceAfterTrial={displayPlan.priceAfterTrial || ''}
                callToAction={displayPlan.callToAction}
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
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { PricingPlan } from '@/components/subscription/PricingPlan';
import { subscriptionService, SubscriptionPlan, Subscription } from '@/services/subscription.service';
import { useRouter } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  // Cargar planes y estado de suscripción
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Verificar autenticación
        const supabase = createClientComponent();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsAuthenticated(true);
          
          // Cargar la suscripción actual si el usuario está autenticado
          const subscription = await subscriptionService.getCurrentSubscription();
          setCurrentSubscription(subscription);
        }
        
        // Cargar planes de suscripción
        const plans = await subscriptionService.getSubscriptionPlans();
        setPlans(plans);
        
      } catch (err: any) {
        console.error('Error al cargar datos:', err);
        setError(err.message || 'Ocurrió un error al cargar los planes de suscripción');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Iniciar proceso de suscripción
  const handleSelectPlan = async (planId: string) => {
    try {
      // Redirigir a login si no está autenticado
      if (!isAuthenticated) {
        router.push(`/login?returnTo=${encodeURIComponent('/pricing')}`);
        return;
      }
      
      setIsProcessing(true);
      setError(null);
      
      // Iniciar proceso de suscripción
      const { approvalUrl } = await subscriptionService.startSubscription(planId);
      
      // Redirigir a PayPal para completar el pago
      window.location.href = approvalUrl;
      
    } catch (err: any) {
      console.error('Error al iniciar suscripción:', err);
      setError(err.message || 'Ocurrió un error al procesar la suscripción');
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Planes y Precios</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades y comienza a organizar tu vida con SoulDream.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6 max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <span className="ml-2">Cargando planes...</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingPlan
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentSubscription?.plan_id === plan.id}
              onSelectPlan={handleSelectPlan}
              isLoading={isProcessing}
            />
          ))}
        </div>
      )}
      
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Todas las suscripciones incluyen</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {['Actualizaciones gratuitas', 'Sincronización entre dispositivos', 'Atención al cliente', 'Copias de seguridad automáticas'].map((feature) => (
            <div key={feature} className="flex items-center p-4 border rounded-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="ml-3 text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
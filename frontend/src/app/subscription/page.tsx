import { PricingPlans } from '@/components/subscription/PricingPlans';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planes y Precios | SoulDream',
  description: 'Elige el plan que mejor se adapte a tus necesidades y potencia tu productividad con SoulDream.',
};

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Potencia tu productividad con SoulDream
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Elige el plan perfecto para ti y comienza a organizar tu vida de manera más efectiva con la ayuda de nuestra IA.
          </p>
        </div>
        
        <PricingPlans />
      </div>
    </div>
  );
} 
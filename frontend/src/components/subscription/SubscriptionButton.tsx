'use client';

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { paypalService } from "@/lib/paypal";
import { toast } from "@/components/ui/use-toast";

interface SubscriptionButtonProps {
  planId: string;
  amount: string;
  onSuccess?: () => void;
}

export function SubscriptionButton({ planId, amount, onSuccess }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  // Definimos los IDs de los planes
  const MONTHLY_PLAN_ID = 'P-1H048096T5545353AM7U2EQQ';
  const ANNUAL_PLAN_ID = 'P-25P774007P7890240M7U2DTA';

  return (
    <div className="w-full max-w-sm mx-auto">
      <PayPalButtons
        createSubscription={(data, actions) => {
          return actions.subscription.create({
            plan_id: planId === ANNUAL_PLAN_ID ? ANNUAL_PLAN_ID : MONTHLY_PLAN_ID,
            application_context: {
              shipping_preference: "NO_SHIPPING",
              return_url: `${window.location.origin}/dashboard/profile/subscription/success`,
              cancel_url: `${window.location.origin}/dashboard/profile/subscription/cancel`
            }
          });
        }}
        onApprove={async (data, actions) => {
          setLoading(true);
          try {
            if (data.subscriptionID) {
              await paypalService.updateUserSubscriptionTier("pro");
              toast({
                title: "¡Suscripción exitosa!",
                description: "Tu suscripción ha sido activada correctamente.",
              });
              onSuccess?.();
            }
          } catch (error) {
            console.error('Error al procesar la suscripción:', error);
            toast({
              title: "Error",
              description: "Hubo un problema al activar tu suscripción. Por favor contacta a soporte.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        }}
        onError={(err) => {
          console.error('Error PayPal:', err);
          toast({
            title: "Error",
            description: "Hubo un error al procesar el pago. Por favor intenta de nuevo.",
            variant: "destructive",
          });
        }}
        style={{
          shape: 'pill',
          color: 'blue',
          layout: 'horizontal',
          label: 'subscribe'
        }}
        disabled={loading}
      />
    </div>
  );
} 
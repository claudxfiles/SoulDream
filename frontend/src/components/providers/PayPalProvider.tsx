'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect } from "react";

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      console.error("PayPal Client ID no está configurado. Por favor, configura NEXT_PUBLIC_PAYPAL_CLIENT_ID en tu archivo .env.local");
    }
  }, [clientId]);

  const paypalOptions = {
    clientId: clientId || "",
    currency: "USD",
    intent: "subscription",
    vault: true,
    components: "buttons",
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
} 
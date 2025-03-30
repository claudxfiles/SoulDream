'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "subscription",
    vault: true,
    components: "buttons",
  };

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error("PayPal Client ID no está configurado");
    return <>{children}</>;
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
} 
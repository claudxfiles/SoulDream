'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
  currency: "USD",
  intent: "subscription",
  vault: true,
  components: "buttons",
  enableFunding: ["card"],
  disableFunding: ["paylater"],
  debug: true // Habilitar modo debug
};

export function PayPalProvider({ children }: { children: React.ReactNode }) {
  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  );
} 
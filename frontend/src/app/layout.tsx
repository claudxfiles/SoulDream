// Importar parches para compatibilidad de módulos Node.js
import '@/patches';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster"
import { ThemeScript } from './ThemeScript';
import { PayPalProvider } from "@/components/providers/PayPalProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoulDream - Tu plataforma all-in-one para gestión personal",
  description: "Gestiona tus tareas, finanzas y más con SoulDream",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <PayPalProvider>
            <Providers>
              {children}
            </Providers>
          </PayPalProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}

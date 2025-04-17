// Importar parches para compatibilidad de módulos Node.js
import '@/patches';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'sonner';
import { ThemeScript } from './ThemeScript';
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Suspense } from "react";
import { Analytics } from '@/components/Analytics';
import { SpeedInsights } from "@vercel/speed-insights/next"

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
        <Suspense fallback={null}>
          <QueryProvider>
            <Providers>
              <Suspense fallback={null}>
                {children}
              </Suspense>
            </Providers>
          </QueryProvider>
        </Suspense>
        <Toaster richColors closeButton position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

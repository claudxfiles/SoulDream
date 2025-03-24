'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

// Cliente para React Query - con configuración de manejo de errores 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Crear el contexto con valores por defecto
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {}
});

// Hook personalizado para usar el contexto
export const useTheme = () => useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Inicializamos el tema cuando el componente se monta
  useEffect(() => {
    // No ejecutar en el servidor
    if (typeof window === 'undefined') return;
    
    // Verificar si hay un tema guardado
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Si no hay tema guardado, usamos la preferencia del sistema
    if (!savedTheme) {
      const systemTheme: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      // Si hay tema guardado, lo usamos
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    
    setMounted(true);
  }, []);

  // Función para cambiar entre temas
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Aplicar clase al elemento html
    document.documentElement.classList.toggle('dark');
    
    // Guardar preferencia en localStorage
    localStorage.setItem('theme', newTheme);
  };

  // Si no está montado, devolvemos solo los children para evitar hidratación incorrecta
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
} 
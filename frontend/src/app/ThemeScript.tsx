'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    try {
      // Al montar el componente, comprobamos si hay un tema guardado
      const savedTheme = localStorage.getItem('theme');
      
      // Si no hay tema guardado, comprobamos la preferencia del sistema
      if (!savedTheme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
      } else {
        // Si hay tema guardado, lo aplicamos directamente al documento
        document.documentElement.classList.remove('dark'); // Eliminar primero
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (error) {
      // Manejo de errores en caso de problemas con localStorage
      console.error('Error al aplicar el tema:', error);
    }
  }, []);
  
  // No renderizamos nada, es solo un script
  return null;
} 
import { useEffect, useRef } from 'react';
import { addDays, startOfTomorrow, isAfter, differenceInMilliseconds } from 'date-fns';

export const useHabitReset = (onReset: () => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetDateRef = useRef<string | null>(null);

  useEffect(() => {
    const scheduleNextReset = () => {
      // Limpiar el timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Obtener la fecha actual y la próxima medianoche
      const now = new Date();
      const tomorrow = startOfTomorrow();
      
      // Verificar si necesitamos hacer reset ahora
      const todayDate = now.toLocaleDateString('es-ES', { timeZone: 'America/Santiago' });
      const storedLastReset = localStorage.getItem('lastHabitReset');
      
      if (storedLastReset !== todayDate) {
        // Si es después de medianoche y no se ha hecho reset, hacerlo ahora
        if (isAfter(now, tomorrow)) {
          console.log('Ejecutando reset inmediato de hábitos');
          onReset();
          localStorage.setItem('lastHabitReset', todayDate);
          lastResetDateRef.current = todayDate;
        }
      }

      // Calcular el tiempo exacto hasta la próxima medianoche
      const msUntilNextReset = differenceInMilliseconds(tomorrow, now);
      console.log('Próximo reset programado en (ms):', msUntilNextReset);
      
      // Programar el próximo reset
      timeoutRef.current = setTimeout(() => {
        console.log('Ejecutando reset programado de hábitos');
        onReset();
        const nextResetDate = new Date().toLocaleDateString('es-ES', { timeZone: 'America/Santiago' });
        localStorage.setItem('lastHabitReset', nextResetDate);
        lastResetDateRef.current = nextResetDate;
        scheduleNextReset();
      }, msUntilNextReset + 1000); // Agregamos 1 segundo para asegurar que estamos en el nuevo día
    };

    // Iniciar el programador
    scheduleNextReset();

    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onReset]);
}; 
import { useEffect, useRef } from 'react';
import { addDays, startOfTomorrow, isAfter } from 'date-fns';

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
      
      // Si no se ha hecho reset hoy
      const todayDate = now.toISOString().split('T')[0];
      if (lastResetDateRef.current !== todayDate) {
        // Si es después de medianoche y no se ha hecho reset, hacerlo ahora
        if (isAfter(now, tomorrow)) {
          onReset();
          lastResetDateRef.current = todayDate;
        }
      }

      // Calcular el tiempo hasta la próxima medianoche
      const msUntilNextReset = tomorrow.getTime() - now.getTime();
      
      // Programar el próximo reset
      timeoutRef.current = setTimeout(() => {
        onReset();
        lastResetDateRef.current = new Date().toISOString().split('T')[0];
        scheduleNextReset();
      }, msUntilNextReset);
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
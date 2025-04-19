import { useEffect, useRef } from 'react';
import { addDays, startOfTomorrow, isAfter, differenceInMilliseconds, startOfToday, isSameDay } from 'date-fns';

export const useHabitReset = (onReset: () => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetDateRef = useRef<string | null>(null);

  useEffect(() => {
    const scheduleNextReset = () => {
      // Limpiar el timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const now = new Date();
      const todayStart = startOfToday();
      const tomorrow = startOfTomorrow();
      
      // Formatear fechas para comparación
      const todayDate = now.toISOString().split('T')[0];
      const storedLastReset = localStorage.getItem('lastHabitReset');
      
      console.log('Verificando reset:', {
        now: now.toISOString(),
        todayDate,
        storedLastReset,
        isAfterMidnight: isAfter(now, todayStart),
        needsReset: !storedLastReset || !isSameDay(new Date(storedLastReset), now)
      });

      // Forzar reset si:
      // 1. No hay fecha de último reset O
      // 2. El último reset no fue hoy
      if (!storedLastReset || !isSameDay(new Date(storedLastReset), now)) {
        console.log('Ejecutando reset forzado de hábitos');
        onReset();
        localStorage.setItem('lastHabitReset', todayDate);
        lastResetDateRef.current = todayDate;
      }

      // Calcular el tiempo hasta la próxima medianoche
      const msUntilNextReset = differenceInMilliseconds(tomorrow, now);
      console.log('Próximo reset programado en (ms):', msUntilNextReset, 'aprox.', Math.round(msUntilNextReset/3600000), 'horas');
      
      // Programar el próximo reset
      timeoutRef.current = setTimeout(() => {
        const resetTime = new Date();
        const resetDate = resetTime.toISOString().split('T')[0];
        console.log('Ejecutando reset programado de hábitos:', resetDate);
        onReset();
        localStorage.setItem('lastHabitReset', resetDate);
        lastResetDateRef.current = resetDate;
        scheduleNextReset();
      }, msUntilNextReset + 1000);
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
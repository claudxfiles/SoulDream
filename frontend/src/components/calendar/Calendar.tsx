'use client';

import React from 'react';
import { CalendarView } from './CalendarView';

// Usar memo para evitar re-renderizados innecesarios
const Calendar = React.memo(function Calendar() {
  return <CalendarView />;
});

// Exportar con nombre explícito para DevTools
Calendar.displayName = 'Calendar';
export { Calendar }; 
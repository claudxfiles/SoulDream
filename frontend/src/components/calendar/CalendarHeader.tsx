'use client';

import { Calendar as CalendarIcon } from 'lucide-react';

export function CalendarHeader() {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
      </div>
      <p className="text-muted-foreground">
        Visualiza y gestiona todos tus eventos y tareas en un solo lugar.
      </p>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCalendarStore } from '@/store/calendarStore';
import { WorkoutScheduler } from './WorkoutScheduler';

export function WorkoutCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { events } = useCalendarStore();

  // Filtrar solo eventos de tipo workout
  const workoutEvents = events.filter(event => event.type === 'workout');

  // Obtener fechas con entrenamientos programados
  const datesWithWorkouts = workoutEvents.map(event => new Date(event.start));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendario de Actividad</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Programar Entrenamiento</Button>
          </SheetTrigger>
          <SheetContent>
            <WorkoutScheduler />
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              booked: datesWithWorkouts
            }}
            modifiersStyles={{
              booked: {
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '50%'
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Próximos Entrenamientos</h3>
          <div className="space-y-2">
            {workoutEvents
              .filter(event => new Date(event.start) >= new Date())
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map(event => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border bg-card text-card-foreground"
                >
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.start).toLocaleDateString()} - {event.metadata?.duration} min
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {event.metadata?.workoutType}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  description?: string;
}

interface CalendarDayCardProps {
  events: CalendarEvent[];
  className?: string;
}

export function CalendarDayCard({ events, className }: CalendarDayCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Calendario</CardTitle>
        <Link href="/dashboard/calendar" className="text-xs text-muted-foreground hover:text-primary">
          Ver completo
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos para hoy.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => {
              const startTime = format(parseISO(event.start_time), 'HH:mm');
              const endTime = event.end_time ? ` - ${format(parseISO(event.end_time), 'HH:mm')}` : '';
              return (
                <li key={event.id} className="flex items-start space-x-3">
                   <div className="w-2 h-2 bg-blue-500 rounded-full mt-[6px]"></div> {/* Dot indicator */}
                   <div>
                     <p className="text-sm font-medium leading-none">{event.title}</p>
                     <p className="text-xs text-muted-foreground">{startTime}{endTime}{event.description ? ` - ${event.description}` : ''}</p>
                   </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 
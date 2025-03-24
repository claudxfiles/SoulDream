'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type CalendarEventProps = {
  event: {
    id: string;
    summary: string;
    description?: string | null;
    start: {
      dateTime: string;
    };
    end: {
      dateTime: string;
    };
    location?: string | null;
    colorId?: string | null;
  };
  compact?: boolean;
};

// Mapeo de colorId a clases de Tailwind
const colorMap: Record<string, string> = {
  '1': 'bg-red-100 border-red-500 text-red-800',
  '2': 'bg-orange-100 border-orange-500 text-orange-800',
  '3': 'bg-yellow-100 border-yellow-500 text-yellow-800',
  '4': 'bg-green-100 border-green-500 text-green-800',
  '5': 'bg-blue-100 border-blue-500 text-blue-800',
  '6': 'bg-indigo-100 border-indigo-500 text-indigo-800',
  '7': 'bg-purple-100 border-purple-500 text-purple-800',
  '8': 'bg-pink-100 border-pink-500 text-pink-800',
  '9': 'bg-gray-100 border-gray-500 text-gray-800',
  '10': 'bg-cyan-100 border-cyan-500 text-cyan-800',
  '11': 'bg-green-50 border-green-300 text-green-700',
};

export function CalendarEvent({ event, compact = false }: CalendarEventProps) {
  // Formatos de fecha
  const startDate = parseISO(event.start.dateTime);
  const endDate = parseISO(event.end.dateTime);
  
  const timeFormat = compact ? 'HH:mm' : 'HH:mm';
  const timeString = `${format(startDate, timeFormat, { locale: es })} - ${format(endDate, timeFormat, { locale: es })}`;
  
  // Determinar color del evento
  const colorClass = event.colorId ? colorMap[event.colorId] || colorMap['9'] : colorMap['9'];
  
  if (compact) {
    return (
      <div
        className={cn(
          "px-2 py-1 text-xs rounded border-l-2 mb-1 truncate",
          colorClass
        )}
        title={`${event.summary}\n${timeString}${event.description ? `\n${event.description}` : ''}`}
      >
        <p className="font-medium truncate">{event.summary}</p>
        <p className="text-xs opacity-70">{timeString}</p>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "p-3 rounded border-l-2",
      colorClass
    )}>
      <div className="flex justify-between items-start">
        <h4 className="font-medium">{event.summary}</h4>
        <span className="text-xs opacity-70">{timeString}</span>
      </div>
      
      {event.description && (
        <p className="text-sm mt-1 opacity-80 whitespace-pre-line line-clamp-2">
          {event.description}
        </p>
      )}
      
      {event.location && (
        <p className="text-xs mt-1 opacity-60">
          📍 {event.location}
        </p>
      )}
    </div>
  );
} 
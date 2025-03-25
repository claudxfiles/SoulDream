import { useState } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { addDays, parseISO, differenceInDays } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { useUpdateEvent } from '@/hooks/useCalendarEvents';

interface UseCalendarDragAndDropProps {
  onEventUpdate?: (event: CalendarEvent) => void;
}

export function useCalendarDragAndDrop({ onEventUpdate }: UseCalendarDragAndDropProps = {}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateEvent = useUpdateEvent();

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeEvent = active.data.current as CalendarEvent;
    const targetDate = over.data.current as Date;

    // Calcular la diferencia en días
    const daysDiff = differenceInDays(
      targetDate,
      parseISO(activeEvent.start)
    );

    if (daysDiff === 0) return;

    // Crear el evento actualizado
    const updatedEvent: CalendarEvent = {
      ...activeEvent,
      start: addDays(parseISO(activeEvent.start), daysDiff).toISOString(),
      end: addDays(parseISO(activeEvent.end), daysDiff).toISOString(),
    };

    try {
      // Actualizar el evento
      await updateEvent(updatedEvent);
      onEventUpdate?.(updatedEvent);
    } catch (error) {
      console.error('Error al actualizar el evento:', error);
      // Aquí podrías mostrar un toast de error
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return {
    activeId,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
} 
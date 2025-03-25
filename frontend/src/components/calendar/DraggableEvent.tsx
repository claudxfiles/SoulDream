import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarEvent } from './CalendarEvent';
import { CalendarEventType } from '@/types/calendar';

interface DraggableEventProps {
  event: {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    color?: string;
  };
  compact?: boolean;
}

export function DraggableEvent({ event, compact }: DraggableEventProps) {
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: event.id,
    data: event,
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 999 : undefined,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`cursor-move ${isDragging ? 'opacity-50' : ''}`}
      {...attributes} 
      {...listeners}
    >
      <CalendarEvent 
        event={{
          id: event.id,
          summary: event.title,
          description: event.description,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
          location: event.location,
          colorId: event.color
        }}
        compact={compact}
      />
    </div>
  );
} 
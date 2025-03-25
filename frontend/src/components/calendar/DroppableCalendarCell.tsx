import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DroppableCalendarCellProps {
  date: Date;
  children: React.ReactNode;
  isToday?: boolean;
  isCurrentMonth?: boolean;
}

export function DroppableCalendarCell({ 
  date, 
  children, 
  isToday = false,
  isCurrentMonth = true 
}: DroppableCalendarCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${date.toISOString()}`,
    data: date,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-24 p-1 border border-border relative',
        isOver && 'bg-primary/10',
        !isCurrentMonth && 'opacity-50 bg-muted/50',
        isToday && 'ring-2 ring-primary ring-inset'
      )}
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-1">
        <span className={cn(
          'text-sm',
          isToday && 'font-bold text-primary'
        )}>
          {format(date, 'd', { locale: es })}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          {format(date, 'EEEE', { locale: es })}
        </span>
      </div>
      <div className="space-y-1 mt-1">
        {children}
      </div>
    </div>
  );
} 
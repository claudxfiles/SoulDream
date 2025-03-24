'use client';

import React from 'react';
import { Habit } from '@/types/habit';
import { HabitCard } from './HabitCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ServerCrash } from "lucide-react";

interface HabitsListProps {
  habits: Habit[] | undefined;
  isLoading: boolean;
  error?: any;
  onComplete: (params: { habitId: string }) => void;
  onDelete?: (habitId: string) => void;
}

export const HabitsList: React.FC<HabitsListProps> = ({
  habits,
  isLoading,
  error,
  onComplete,
  onDelete,
}) => {
  // Estado de carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-3 w-full">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Estado de error
  if (error) {
    return (
      <Alert variant="destructive">
        <ServerCrash className="h-4 w-4" />
        <AlertTitle>Error al cargar hábitos</AlertTitle>
        <AlertDescription>
          {error.message || 'No se pudieron cargar los hábitos. Intenta nuevamente más tarde.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Sin hábitos
  if (!habits || habits.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No hay hábitos</AlertTitle>
        <AlertDescription>
          No tienes hábitos registrados. Crea uno nuevo para comenzar a hacer seguimiento.
        </AlertDescription>
      </Alert>
    );
  }

  // Lista de hábitos
  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onComplete={() => onComplete({ habitId: habit.id })}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}; 
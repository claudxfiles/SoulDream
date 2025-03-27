"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HabitStats } from './HabitStats';
import HabitCalendarView from './HabitCalendarView';
import HabitSettings from './HabitSettings';
import { useGetHabitById } from '@/hooks/useHabits';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HabitDetailsProps {
  habitId: string;
}

export default function HabitDetails({ habitId }: HabitDetailsProps) {
  const { data: habit, isLoading, error } = useGetHabitById(habitId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la información del hábito.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{habit?.title}</h2>
        <span className="text-sm text-muted-foreground">
          Creado el {new Date(habit?.created_at || '').toLocaleDateString()}
        </span>
      </div>

      <HabitSettings habitId={habitId} />
    </div>
  );
} 
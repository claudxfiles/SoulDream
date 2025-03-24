"use client";

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useGetHabitById, useLogHabit, useGetHabitLogs } from '@/hooks/useHabits';
import { HabitLogCreate } from '@/types/habit';

interface HabitCalendarViewProps {
  habitId: string;
}

export default function HabitCalendarView({ habitId }: HabitCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  
  // Obtener datos del hábito y sus registros
  const { data: habit, isLoading: isLoadingHabit, error: habitError } = useGetHabitById(habitId);
  const { data: habitLogs, isLoading: isLoadingLogs, error: logsError } = useGetHabitLogs(habitId);
  
  // Mutación para registrar un hábito completado
  const { mutate: logHabit, isPending: isLogging } = useLogHabit({
    onSuccess: () => {
      toast({
        title: "Hábito registrado",
        description: "Has registrado tu hábito con éxito para esta fecha",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar",
        description: error.message || "No se pudo registrar el hábito",
        variant: "destructive",
      });
    },
  });

  // Si está cargando, mostrar indicador
  if (isLoadingHabit || isLoadingLogs) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si hay un error, mostrar mensaje
  if (habitError || logsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la información del hábito o sus registros.
        </AlertDescription>
      </Alert>
    );
  }

  // Convertir logs a un formato para resaltar días en el calendario
  const completedDates = habitLogs?.map(log => new Date(log.completed_date)) || [];
  
  // Función para verificar si una fecha está completada
  const isDateCompleted = (date: Date) => {
    return completedDates.some(completedDate => 
      format(completedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };
  
  // Función para manejar el registro de hábito
  const handleLogHabit = () => {
    if (!selectedDate) return;
    
    // Verificar si ya está registrado para esta fecha
    if (isDateCompleted(selectedDate)) {
      toast({
        title: "Ya registrado",
        description: "Este hábito ya fue registrado para esta fecha",
      });
      return;
    }
    
    // Registrar el hábito para la fecha seleccionada
    const logData: HabitLogCreate = {
      habit_id: habitId,
      completed_date: format(selectedDate, 'yyyy-MM-dd'),
      notes: "",
    };
    
    logHabit(logData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {habit?.title || 'Cargando...'}
        </h3>
        <div className="text-sm text-muted-foreground">
          Racha actual: <span className="font-bold">{habit?.current_streak || 0} días</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={es}
            modifiers={{
              completed: completedDates,
            }}
            modifiersClassNames={{
              completed: 'bg-green-100 text-green-800 font-bold rounded-full',
            }}
            className="rounded-md border shadow"
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Fecha seleccionada</h4>
            <p className="text-lg">
              {selectedDate ? format(selectedDate, 'PPPP', { locale: es }) : 'Ninguna fecha seleccionada'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedDate && isDateCompleted(selectedDate) ? (
                <span className="flex items-center text-green-600">
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Completado
                </span>
              ) : (
                'Sin registrar'
              )}
            </p>
          </div>
          
          <Button 
            onClick={handleLogHabit} 
            className="w-full" 
            disabled={isLogging || !selectedDate || (selectedDate && isDateCompleted(selectedDate))}
          >
            {isLogging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Marcar como completado'
            )}
          </Button>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Consejos:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Registra tu hábito todos los días para mantener tu racha</li>
              <li>Los días en verde indican que has completado tu hábito</li>
              <li>Puedes registrar hábitos para fechas pasadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
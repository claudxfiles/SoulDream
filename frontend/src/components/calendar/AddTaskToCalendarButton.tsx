'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSyncTaskWithCalendar, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar';
import { Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { parseISO, addHours, isValid } from 'date-fns';

interface AddTaskToCalendarButtonProps {
  task: {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    status: string;
    priority: string;
  };
  children?: React.ReactNode;
  disabled?: boolean;
}

export function AddTaskToCalendarButton({ task, children, disabled }: AddTaskToCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: syncTask } = useSyncTaskWithCalendar();
  const { isConnected, needsReconnect } = useGoogleCalendarStatus();
  const { requestGoogleCalendarPermission } = useAuth();
  const { toast } = useToast();

  const handleAddToCalendar = async () => {
    if (!task.due_date) {
      toast({
        title: 'Fecha requerida',
        description: 'Esta tarea no tiene fecha límite definida.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Si necesita reconectar, primero solicitar permisos
      if (needsReconnect) {
        await requestGoogleCalendarPermission();
        toast({
          title: 'Reconexión necesaria',
          description: 'Por favor, intenta nuevamente después de iniciar sesión con Google.',
        });
        return;
      }

      // Validar y parsear la fecha
      const dueDate = parseISO(task.due_date);
      if (!isValid(dueDate)) {
        toast({
          title: 'Error de fecha',
          description: 'El formato de la fecha no es válido.',
          variant: 'destructive',
        });
        return;
      }

      // Crear evento en Google Calendar
      const event = await syncTask({
        ...task,
        due_date: dueDate.toISOString(), // Asegurar que la fecha esté en formato ISO
      });

      toast({
        title: 'Evento creado',
        description: 'La tarea se ha añadido a tu calendario de Google.',
      });

    } catch (error: any) {
      console.error('Error al añadir evento al calendario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo añadir la tarea al calendario.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay conexión con Google Calendar, mostrar botón para conectar
  if (!isConnected) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          requestGoogleCalendarPermission();
        }}
        disabled={isLoading}
        className="w-full justify-start"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Conectar calendario
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddToCalendar}
      disabled={isLoading || !task.due_date || disabled}
      className="w-full justify-start text-gray-400 hover:text-gray-200 bg-transparent border-gray-800 hover:bg-gray-800"
    >
      {children}
    </Button>
  );
} 
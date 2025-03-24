'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSyncTaskWithCalendar, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar';
import { Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AddTaskToCalendarButtonProps {
  task: {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    status: string;
    priority: string;
  };
}

export function AddTaskToCalendarButton({ task }: AddTaskToCalendarButtonProps) {
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

      // Crear evento en Google Calendar
      const event = await syncTask(task);

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

  if (!isConnected) {
    return null; // No mostrar el botón si no hay conexión con Google
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAddToCalendar}
      disabled={isLoading || !task.due_date}
    >
      {isLoading ? (
        <span className="animate-spin mr-1">⚪</span>
      ) : (
        <Calendar className="h-4 w-4 mr-1" />
      )}
      Añadir al calendario
    </Button>
  );
} 
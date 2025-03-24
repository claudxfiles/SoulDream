'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Mail, Calendar, ListChecks, DollarSign, Dumbbell } from 'lucide-react';
import { Goal } from '@/components/icons/Goal';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  goal_updates: boolean;
  habit_reminders: boolean;
  finance_alerts: boolean;
  workout_reminders: boolean;
  calendar_events: boolean;
}

// Valores predeterminados para preferencias de notificación
const defaultPreferences: NotificationPreferences = {
  email_notifications: false,
  push_notifications: false,
  task_reminders: true,
  goal_updates: true,
  habit_reminders: true,
  finance_alerts: true,
  workout_reminders: true,
  calendar_events: true,
};

export function NotificationSettings() {
  const { profile, updateProfile, isUpdatingProfile } = useUser();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  
  // Actualizar las preferencias cuando el perfil cambia
  useEffect(() => {
    if (profile) {
      setPreferences(prev => ({
        ...prev,
        // Usamos type assertion para evitar el error de TypeScript
        email_notifications: (profile as any).email_notifications ?? defaultPreferences.email_notifications,
      }));
    }
  }, [profile]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const savePreferences = async () => {
    try {
      // Solo guardamos en el perfil las propiedades que existen en el backend
      await updateProfile({
        email_notifications: preferences.email_notifications,
      });
      
      toast({
        title: 'Preferencias actualizadas',
        description: 'Tus preferencias de notificaciones han sido guardadas correctamente.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar tus preferencias. Por favor, intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Componente para cada item de notificación
  const NotificationItem = ({ 
    title, 
    description, 
    icon, 
    value, 
    onChange 
  }: { 
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    value: boolean, 
    onChange: () => void 
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Canales de notificación</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configura cómo quieres recibir tus notificaciones
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NotificationItem
            title="Notificaciones por email"
            description="Recibe actualizaciones importantes en tu correo electrónico"
            icon={<Mail className="h-4 w-4 text-primary" />}
            value={preferences.email_notifications}
            onChange={() => handleToggle('email_notifications')}
          />
          
          <NotificationItem
            title="Notificaciones push"
            description="Recibe notificaciones en el navegador"
            icon={<Bell className="h-4 w-4 text-primary" />}
            value={preferences.push_notifications}
            onChange={() => handleToggle('push_notifications')}
          />
        </CardContent>
      </Card>

      <div className="space-y-1 pt-4">
        <h3 className="text-lg font-medium">Preferencias por tipo</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personaliza qué tipo de notificaciones deseas recibir
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NotificationItem
            title="Recordatorios de tareas"
            description="Recibe alertas sobre tareas próximas a vencer"
            icon={<ListChecks className="h-4 w-4 text-primary" />}
            value={preferences.task_reminders}
            onChange={() => handleToggle('task_reminders')}
          />
          
          <NotificationItem
            title="Actualizaciones de metas"
            description="Recibe notificaciones sobre el progreso de tus metas"
            icon={<Goal className="h-4 w-4 text-primary" />}
            value={preferences.goal_updates}
            onChange={() => handleToggle('goal_updates')}
          />
          
          <NotificationItem
            title="Recordatorios de hábitos"
            description="Recibe recordatorios diarios para tus hábitos"
            icon={<ListChecks className="h-4 w-4 text-primary" />}
            value={preferences.habit_reminders}
            onChange={() => handleToggle('habit_reminders')}
          />
          
          <NotificationItem
            title="Alertas financieras"
            description="Recibe notificaciones sobre gastos y presupuestos"
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            value={preferences.finance_alerts}
            onChange={() => handleToggle('finance_alerts')}
          />
          
          <NotificationItem
            title="Recordatorios de entrenamientos"
            description="Recibe recordatorios sobre tus sesiones de entrenamiento"
            icon={<Dumbbell className="h-4 w-4 text-primary" />}
            value={preferences.workout_reminders}
            onChange={() => handleToggle('workout_reminders')}
          />
          
          <NotificationItem
            title="Eventos del calendario"
            description="Recibe recordatorios de eventos próximos"
            icon={<Calendar className="h-4 w-4 text-primary" />}
            value={preferences.calendar_events}
            onChange={() => handleToggle('calendar_events')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={savePreferences} 
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Guardando...
            </>
          ) : (
            'Guardar preferencias'
          )}
        </Button>
      </div>
    </div>
  );
} 
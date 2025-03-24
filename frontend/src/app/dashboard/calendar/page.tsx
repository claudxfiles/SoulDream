'use client';

import { useState, useEffect } from 'react';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/hooks/useAuth';
import { Calendar } from '@/components/calendar/Calendar';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar as CalendarIcon, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const { isConnected, needsReconnect, statusChecked } = useGoogleCalendarStatus();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Mostrar el prompt de conexión después de verificar el estado
    if (statusChecked) {
      setShowConnectPrompt(!isConnected || needsReconnect);
    }
  }, [isConnected, needsReconnect, statusChecked]);

  const handleConnectCalendar = () => {
    // Redirigir a la página de reconexión con los parámetros correctos
    const params = new URLSearchParams({
      source: 'calendar_page',
      forceConsent: 'true',
      userId: user?.id || ''
    });
    
    router.push(`/auth/reconnect?${params.toString()}`);
  };

  return (
    <DashboardShell>
      <div className="flex flex-col space-y-4">
        <CalendarHeader />

        {showConnectPrompt ? (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                {needsReconnect 
                  ? "Necesitamos permisos adicionales para tu calendario" 
                  : "Conecta Google Calendar"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 dark:text-amber-300">
                {needsReconnect 
                  ? "Tu conexión con Google Calendar requiere permisos adicionales para funcionar correctamente."
                  : "Para ver y gestionar tus eventos, necesitas conectar tu cuenta de Google Calendar."}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="default"
                onClick={handleConnectCalendar}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {needsReconnect ? "Reconectar calendario" : "Conectar Google Calendar"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Calendar />
        )}
      </div>
    </DashboardShell>
  );
} 
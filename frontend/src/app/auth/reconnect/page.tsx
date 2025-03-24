'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ReconnectPage() {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [forceConsent, setForceConsent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requestGoogleCalendarPermission } = useAuth();
  
  useEffect(() => {
    // Obtener parámetros de la URL
    const sourceParam = searchParams.get('source');
    const forceConsentParam = searchParams.get('forceConsent');
    const userIdParam = searchParams.get('userId');
    
    setSource(sourceParam);
    setForceConsent(forceConsentParam === 'true');
    setUserId(userIdParam);
    
    console.log('Página de reconexión cargada:', {
      source: sourceParam,
      forceConsent: forceConsentParam === 'true',
      userId: userIdParam
    });
  }, [searchParams]);
  
  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      setError(null);
      
      console.log('Iniciando reconexión con Google Calendar', { forceConsent });
      
      const { error } = await requestGoogleCalendarPermission({ forceConsent: true });
      
      if (error) {
        throw new Error(`Error durante la reconexión: ${error.message}`);
      }
      
      // No necesitamos redireccionar ya que la función lo hará automáticamente
    } catch (err) {
      console.error('Error en reconexión:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido durante la reconexión');
      setIsReconnecting(false);
    }
  };
  
  const handleCancel = () => {
    router.push('/dashboard/calendar');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reconexión con Google Calendar</CardTitle>
          <CardDescription className="text-center">
            {source === 'calendar_insufficient_scopes' ? (
              "Necesitamos permisos adicionales para acceder a tu calendario"
            ) : source === 'calendar_repair' ? (
              "Es necesario reconectar tu cuenta para reparar la conexión"
            ) : (
              "Reconecta tu cuenta de Google para sincronizar tu calendario"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-start gap-2 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="bg-amber-50 p-4 rounded-md text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> 
                Información importante
              </h3>
              <p className="text-sm">
                Al reconectar tu cuenta, recuerda <strong>permitir todos los accesos solicitados</strong> a tu calendario 
                para que la aplicación funcione correctamente. 
                {forceConsent && " Se te mostrará la pantalla de permisos incluso si ya has conectado tu cuenta anteriormente."}
              </p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Esta reconexión permitirá:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Ver y gestionar eventos de tu calendario</li>
                <li>Crear nuevos eventos relacionados con tus metas y tareas</li>
                <li>Mantener sincronizadas tus actividades</li>
                <li>Recibir recordatorios de eventos importantes</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isReconnecting}>
            Cancelar
          </Button>
          <Button onClick={handleReconnect} disabled={isReconnecting} className="gap-2">
            {isReconnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>
                Reconectar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
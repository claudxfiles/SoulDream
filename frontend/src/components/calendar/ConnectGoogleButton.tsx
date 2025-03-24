'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, RotateCw } from 'lucide-react';

// Tipos de botón
type ButtonMode = 'connect' | 'reconnect';

interface Props {
  mode?: ButtonMode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ConnectGoogleButton({ 
  mode = 'connect', 
  className = '',
  variant = 'secondary',
  size = 'default'
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { requestGoogleCalendarPermission } = useAuth();
  const { toast } = useToast();

  // Determinar textos según el modo
  const buttonText = mode === 'reconnect' 
    ? 'Reconectar Google Calendar' 
    : 'Conectar con Google Calendar';
  
  const loadingText = mode === 'reconnect' 
    ? 'Reconectando...' 
    : 'Conectando...';
  
  const successText = mode === 'reconnect' 
    ? 'Reconexión iniciada' 
    : 'Conexión iniciada';

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      console.log(`Iniciando ${mode === 'reconnect' ? 're' : ''}conexión con Google Calendar...`);
      
      toast({
        title: loadingText,
        description: 'Iniciando proceso de autenticación con Google',
      });
      
      // Si es reconexión, forzar el parámetro forceConsent
      const { data, error } = await requestGoogleCalendarPermission({
        forceConsent: mode === 'reconnect'
      });
      
      if (error) {
        console.error('Error al conectar con Google:', error);
        toast({
          title: 'Error de conexión',
          description: error.message || 'No se pudo conectar con Google Calendar',
          variant: 'destructive',
        });
      } else {
        console.log('Proceso de autenticación iniciado correctamente', data);
        toast({
          title: successText,
          description: 'Redirigiendo a Google para autorizar el acceso al calendario',
        });
      }
    } catch (error: any) {
      console.error(`Error en el proceso de ${mode === 'reconnect' ? 're' : ''}conexión con Google:`, error);
      toast({
        title: 'Error de conexión',
        description: error.message || 'No se pudo conectar con Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isLoading}
      className={`flex items-center gap-2 ${className}`}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <RotateCw className="h-4 w-4 animate-spin" />
      ) : (
        <Calendar className="h-4 w-4" />
      )}
      {buttonText}
    </Button>
  );
} 
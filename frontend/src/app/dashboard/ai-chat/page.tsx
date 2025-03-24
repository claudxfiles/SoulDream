'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AIChatRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redireccionar a la nueva página de Asistente IA
    router.replace('/dashboard/ai-assistant');
  }, [router]);
  
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Redirigiendo al Asistente IA...</p>
      </div>
    </div>
  );
} 
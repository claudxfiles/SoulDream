'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/shared/icons';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <Icons.alert className="h-8 w-8" />
          </div>
          <CardTitle>Suscripción Cancelada</CardTitle>
          <CardDescription className="mt-2">
            Has cancelado el proceso de suscripción. No se ha realizado ningún cargo.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Si enfrentaste algún problema durante el proceso o tienes preguntas, no dudes en contactar a nuestro equipo de soporte.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.push('/subscription')}>
            Ver Planes Nuevamente
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
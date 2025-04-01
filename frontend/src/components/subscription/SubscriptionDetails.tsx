import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Check } from 'lucide-react';

export const SubscriptionDetails = () => {
  const { data: subscription, isLoading, error } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="p-6">
          <p className="text-destructive">
            Error al cargar la información de suscripción
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Detalles de Suscripción</span>
          <Badge variant={subscription.plan_status === 'active' ? 'default' : 'destructive'}>
            {subscription.plan_status === 'active' ? 'Activa' : 'Inactiva'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">{subscription.plan_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Precio</p>
            <p className="font-medium">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: subscription.plan_currency,
              }).format(subscription.plan_value)}
              /{subscription.plan_interval}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Miembro desde</p>
            <p className="font-medium">
              {format(new Date(subscription.member_since), 'PP', { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Válido hasta</p>
            <p className="font-medium">
              {subscription.plan_validity_end 
                ? format(new Date(subscription.plan_validity_end), 'PP', { locale: es })
                : 'Sin fecha de expiración'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">Características incluidas:</p>
          <ul className="space-y-1">
            {subscription.plan_features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 
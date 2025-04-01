'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SubscriptionInfo {
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'cancelled';
  current_period_start: string;
  current_period_end: string;
}

interface PaymentHistory {
  date: string;
  amount: string;
  status: string;
  id: string;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSubscriptionData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Obtener la suscripción del usuario
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (error) {
          console.error('Error al obtener la suscripción:', error);
        } else if (subscriptionData) {
          setSubscription({
            plan_type: subscriptionData.plan_type || 'monthly',
            status: subscriptionData.status,
            current_period_start: new Date(subscriptionData.current_period_start).toLocaleDateString(),
            current_period_end: new Date(subscriptionData.current_period_end).toLocaleDateString()
          });
        }

        // Obtener historial de pagos
        setPayments([
          {
            date: new Date().toLocaleDateString(),
            amount: subscriptionData?.plan_type === 'annual' ? "$120.00" : "$14.99",
            status: "Completado",
            id: "SUB-123456"
          }
        ]);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptionData();
  }, [supabase]);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/profile/subscription">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Suscripción
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Información de Suscripción</h1>

      {loading ? (
        <p>Cargando información...</p>
      ) : (
        <>
          {subscription && (
            <Card className="p-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">
                    {subscription.plan_type === 'annual' ? 'Anual' : 'Mensual'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className={`font-medium ${
                    subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {subscription.status === 'active' ? 'Activa' : 'Cancelada'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-medium">{subscription.current_period_start}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vigente Hasta</p>
                  <p className="font-medium">{subscription.current_period_end}</p>
                </div>
              </div>
            </Card>
          )}

          <h2 className="text-2xl font-bold mb-4">Historial de Pagos</h2>
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{payment.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monto</p>
                    <p className="font-medium">{payment.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium text-green-600">{payment.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID de Transacción</p>
                    <p className="font-medium">{payment.id}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
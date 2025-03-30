'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  plan_name: string;
  billing_interval: string;
}

interface SupabasePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  subscription_plans: {
    name: string;
    billing_interval: string;
  };
}

type DatabasePayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  subscription_plans: {
    name: string;
    billing_interval: string;
  }[];
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/subscription/history');
      return;
    }

    const fetchPaymentHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            currency,
            status,
            created_at,
            subscription_plans!inner (
              name,
              billing_interval
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedPayments: PaymentHistory[] = (data as unknown as DatabasePayment[]).map(payment => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            created_at: payment.created_at,
            plan_name: payment.subscription_plans[0].name,
            billing_interval: payment.subscription_plans[0].billing_interval
          }));
          setPayments(formattedPayments);
        }
      } catch (error: any) {
        console.error('Error fetching payment history:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el historial de pagos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [user, supabase, router, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Historial de Pagos</h1>
          <Button 
            variant="outline"
            onClick={() => router.push('/subscription/manage')}
          >
            Volver a Mi Suscripción
          </Button>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No hay pagos registrados aún.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">
                    {payment.plan_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: payment.currency
                    }).format(payment.amount)}
                  </p>
                  <span className={`text-sm ${
                    payment.status === 'completed' 
                      ? 'text-green-600' 
                      : payment.status === 'failed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {payment.status === 'completed' ? 'Completado' :
                     payment.status === 'failed' ? 'Fallido' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
} 
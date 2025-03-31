'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PaymentHistory {
  date: string;
  amount: string;
  status: string;
  id: string;
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí se implementará la lógica para obtener el historial de pagos
    // Por ahora mostraremos datos de ejemplo
    setPayments([
      {
        date: new Date().toLocaleDateString(),
        amount: "$14.99",
        status: "Completado",
        id: "SUB-123456"
      }
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/profile">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a mi Perfil
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Historial de Pagos</h1>

      {loading ? (
        <p>Cargando historial...</p>
      ) : (
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
      )}
    </div>
  );
} 
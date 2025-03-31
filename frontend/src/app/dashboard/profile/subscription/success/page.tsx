'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          ¡Suscripción Activada con Éxito!
        </h1>
        
        <p className="text-muted-foreground mb-4">
          Tu período de prueba de 7 días ha comenzado. Disfruta de todas las funcionalidades premium de SoulDream AI.
        </p>
        
        <p className="text-sm text-muted-foreground mb-8">
          No se realizará ningún cargo hasta que finalice tu período de prueba.
        </p>

        <div className="space-x-4">
          <Link href="/dashboard">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Ir al Dashboard
            </Button>
          </Link>
          
          <Link href="/dashboard/profile/subscription/history">
            <Button variant="outline">
              Ver Historial de Pagos
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
} 
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          Proceso de Suscripción Cancelado
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Has cancelado el proceso de suscripción. No te preocupes, no se ha realizado ningún cargo.
        </p>

        <Link href="/dashboard/profile">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a mi Perfil
          </Button>
        </Link>
      </Card>
    </div>
  );
} 
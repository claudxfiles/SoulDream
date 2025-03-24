"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, PlayIcon, ClockIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export default function AbdominalWorkoutPage() {
  const router = useRouter();

  const handleStartWorkout = () => {
    router.push("/dashboard/workout/tracker?template=abdominal");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Definición Abdominal"
          description="Entrenamiento enfocado en fortalecer y definir los músculos abdominales"
        />
        <Link href="/dashboard/workout">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ejercicios</CardTitle>
            <CardDescription>Lista de ejercicios para este entrenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Crunches con Peso",
                  sets: 4,
                  reps: 15,
                  notes: "Mantén la tensión en el abdomen durante todo el movimiento"
                },
                {
                  name: "Plancha Lateral",
                  sets: 3,
                  reps: 45,
                  notes: "Mantén la posición durante los segundos indicados"
                },
                {
                  name: "Elevaciones de Piernas en Barra",
                  sets: 4,
                  reps: 12,
                  notes: "Controla el movimiento tanto en la subida como en la bajada"
                },
                {
                  name: "Dragon Flag",
                  sets: 3,
                  reps: 8,
                  notes: "Mantén el cuerpo rígido y controla el descenso"
                }
              ].map((exercise, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{exercise.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {exercise.sets} series x {exercise.reps} {typeof exercise.reps === 'number' ? 'reps' : 'segundos'}
                    </span>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartWorkout} className="w-full gap-2">
              <PlayIcon className="h-4 w-4" />
              Iniciar entrenamiento
            </Button>
          </CardFooter>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Detalles del entrenamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Duración estimada: 35 minutos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consejos */}
          <Card>
            <CardHeader>
              <CardTitle>Consejos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Mantén una respiración controlada durante los ejercicios</li>
                <li>• Enfócate en la contracción del abdomen</li>
                <li>• Descansa 60-90 segundos entre series</li>
                <li>• Bebe agua entre ejercicios</li>
                <li>• Realiza un calentamiento adecuado antes de comenzar</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
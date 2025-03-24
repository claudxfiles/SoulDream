"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, PlayIcon, ClockIcon, DumbbellIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { getWorkoutTemplateWithExercises } from "@/lib/workout";
import { WorkoutTemplateWithExercises } from "@/types/workout";
import { PageHeader } from "@/components/ui/page-header";

interface WorkoutTemplateDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkoutTemplateDetailPage({ params }: WorkoutTemplateDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [template, setTemplate] = useState<WorkoutTemplateWithExercises | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await getWorkoutTemplateWithExercises(params.id);
        setTemplate(data);
      } catch (error) {
        console.error("Error loading workout template:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la plantilla de entrenamiento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadTemplate();
    }
  }, [params.id, toast]);

  const handleStartWorkout = () => {
    router.push(`/dashboard/workout/tracker?template=${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded"></div>
          <div className="h-4 w-1/4 bg-muted rounded"></div>
          <div className="h-[200px] bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Plantilla no encontrada</h2>
          <p className="text-muted-foreground mb-4">
            La plantilla de entrenamiento que buscas no existe o no tienes acceso a ella.
          </p>
          <Link href="/dashboard/workout">
            <Button variant="outline">Volver al dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={template.name}
          description="Plantilla de entrenamiento"
          icon={<DumbbellIcon className="h-6 w-6 text-primary" />}
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
              {template.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{exercise.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {exercise.sets} series x {exercise.reps} reps
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
                  <span>Duración estimada: {template.duration || "No especificada"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DumbbellIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Tipo: {template.type}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {template.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{template.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, PlayIcon, ClockIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { getWorkoutById } from "@/lib/workout";
import { WorkoutWithExercises } from "@/types/workout";
import { PageHeader } from "@/components/ui/page-header";

interface WorkoutDetailPageProps {
  params: {
    id: string;
  };
}

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWorkout = async () => {
      if (!params.id) {
        toast({
          title: "Error",
          description: "ID de entrenamiento no válido",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const data = await getWorkoutById(params.id);
        setWorkout(data);
      } catch (error: any) {
        console.error(`Error loading workout ${params.id}:`, error);
        toast({
          title: "Error",
          description: error.message === "Workout not found" 
            ? `El entrenamiento con ID ${params.id} no existe o ha sido eliminado`
            : "Error al cargar el entrenamiento. Por favor, intenta de nuevo.",
          variant: "destructive",
        });
        setWorkout(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [params.id, toast]);

  const handleStartWorkout = () => {
    if (!workout) return;
    
    const workoutData = {
      id: workout.id,
      name: workout.name,
      type: workout.workout_type,
      exercises: workout.exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        duration_seconds: exercise.duration_seconds,
        distance: exercise.distance,
        units: exercise.units,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes
      }))
    };
    
    router.push(`/dashboard/workout/tracker?workout=${encodeURIComponent(JSON.stringify(workoutData))}`);
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

  if (!workout) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Entrenamiento no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            El entrenamiento que buscas no existe o no tienes acceso a él.
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
          title={workout.name}
          description={`Creado el ${format(new Date(workout.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}`}
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
              {workout.exercises.map((exercise, index) => (
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
                  <span>Duración estimada: {workout.duration_minutes ? `${workout.duration_minutes} minutos` : "No especificada"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Última vez: {workout.last_performed 
                      ? format(new Date(workout.last_performed), "d 'de' MMMM", { locale: es })
                      : "Nunca realizado"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {workout.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{workout.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 
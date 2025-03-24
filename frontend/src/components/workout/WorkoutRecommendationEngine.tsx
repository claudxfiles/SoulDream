"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getWorkoutStatistics, getRecentExercises, getExerciseTemplates } from "@/lib/workout";
import { WorkoutStatistics, MuscleGroup, WorkoutType, ExerciseTemplate } from "@/types/workout";
import { ChevronRightIcon, DumbbellIcon, TrendingUpIcon, BrainCircuitIcon, BarChart3Icon, ListFilterIcon, ZapIcon } from "lucide-react";
import Link from "next/link";

interface Recommendation {
  type: 'muscle_group' | 'exercise' | 'frequency' | 'volume' | 'recovery';
  title: string;
  description: string;
  icon: JSX.Element;
  priority: number; // 1-10, 10 being highest
  suggestedWorkout?: {
    name: string;
    muscleGroups: MuscleGroup[];
    exerciseCount: number;
    estimatedDuration: number;
  };
}

export default function WorkoutRecommendationEngine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statistics, setStatistics] = useState<WorkoutStatistics | null>(null);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar datos del usuario para generar recomendaciones
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Cargar estadísticas de entrenamiento
        const stats = await getWorkoutStatistics(user.id);
        setStatistics(stats);
        
        // Cargar ejercicios recientes
        const exercises = await getRecentExercises(user.id, 20);
        setRecentExercises(exercises);
        
        // Cargar plantillas de ejercicios
        const templates = await getExerciseTemplates();
        setExerciseTemplates(templates);
        
      } catch (error) {
        console.error("Error loading user workout data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de entrenamiento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user?.id, toast]);

  // Generar recomendaciones basadas en los datos del usuario
  useEffect(() => {
    if (!statistics || recentExercises.length === 0) return;
    
    const generatedRecommendations: Recommendation[] = [];
    
    // 1. Recomendación de frecuencia de entrenamiento
    if (statistics.totalWorkouts < 5) {
      generatedRecommendations.push({
        type: 'frequency',
        title: 'Aumenta tu frecuencia de entrenamiento',
        description: 'Para mejores resultados, intenta entrenar al menos 3-4 veces por semana de forma consistente.',
        icon: <BarChart3Icon className="h-5 w-5 text-primary" />,
        priority: 9
      });
    }
    
    // 2. Recomendación para grupos musculares descuidados
    const muscleGroups = Object.keys(statistics.mostWorkedMuscleGroups) as MuscleGroup[];
    if (muscleGroups.length > 0) {
      // Encontrar grupos musculares poco trabajados
      const neglectedMuscleGroups: MuscleGroup[] = [];
      
      Object.values(MuscleGroup).forEach(group => {
        if (!muscleGroups.includes(group) && 
            group !== MuscleGroup.FULL_BODY && 
            group !== MuscleGroup.CARDIO) {
          neglectedMuscleGroups.push(group);
        }
      });
      
      if (neglectedMuscleGroups.length > 0) {
        // Seleccionar un grupo aleatorio de los descuidados
        const randomIndex = Math.floor(Math.random() * neglectedMuscleGroups.length);
        const muscleGroup = neglectedMuscleGroups[randomIndex];
        
        // Crear un entrenamiento sugerido para este grupo muscular
        const muscleGroupName = muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1);
        
        // Filtrar ejercicios para este grupo muscular
        const muscleExercises = exerciseTemplates.filter(
          template => template.muscle_group === muscleGroup
        );
        
        // Crear sugerencia de entrenamiento si hay ejercicios disponibles
        if (muscleExercises.length > 0) {
          const workoutName = `Entrenamiento de ${muscleGroupName}`;
          const exerciseCount = Math.min(5, muscleExercises.length);
          
          generatedRecommendations.push({
            type: 'muscle_group',
            title: `Trabaja tu ${muscleGroupName}`,
            description: `Has descuidado este grupo muscular. Incorpora ejercicios de ${muscleGroupName} para un desarrollo muscular equilibrado.`,
            icon: <DumbbellIcon className="h-5 w-5 text-primary" />,
            priority: 8,
            suggestedWorkout: {
              name: workoutName,
              muscleGroups: [muscleGroup],
              exerciseCount: exerciseCount,
              estimatedDuration: 40
            }
          });
        }
      }
    }
    
    // 3. Recomendación de variedad de ejercicios
    if (recentExercises.length < 10 && statistics.totalWorkouts > 5) {
      generatedRecommendations.push({
        type: 'exercise',
        title: 'Aumenta la variedad de tus ejercicios',
        description: 'Probar diferentes ejercicios estimula mejor tus músculos y previene mesetas en tu progreso.',
        icon: <ListFilterIcon className="h-5 w-5 text-primary" />,
        priority: 7
      });
    }
    
    // 4. Recomendación de volumen de entrenamiento
    if (statistics.totalWorkouts > 10 && statistics.averageDuration < 30) {
      generatedRecommendations.push({
        type: 'volume',
        title: 'Aumenta el volumen de tus entrenamientos',
        description: 'Tus entrenamientos son cortos. Intenta aumentar gradualmente el volumen (más series o ejercicios) para estimular mejor el crecimiento muscular.',
        icon: <TrendingUpIcon className="h-5 w-5 text-primary" />,
        priority: 6
      });
    }
    
    // 5. Recomendación de entrenamiento completo
    if (muscleGroups.length >= 4 && !statistics.workoutsByType[WorkoutType.FULL_BODY]) {
      generatedRecommendations.push({
        type: 'muscle_group',
        title: 'Prueba un entrenamiento de cuerpo completo',
        description: 'Basado en tu historial, podrías beneficiarte de entrenamientos de cuerpo completo para mejorar la eficiencia de tus sesiones.',
        icon: <ZapIcon className="h-5 w-5 text-primary" />,
        priority: 5,
        suggestedWorkout: {
          name: 'Entrenamiento de cuerpo completo',
          muscleGroups: [MuscleGroup.FULL_BODY],
          exerciseCount: 6,
          estimatedDuration: 60
        }
      });
    }
    
    // 6. Recomendación de recuperación
    if (statistics.streakDays > 5) {
      generatedRecommendations.push({
        type: 'recovery',
        title: 'Programa un día de descanso',
        description: 'Has entrenado varios días consecutivos. Recuerda que el descanso es crucial para la recuperación muscular y el crecimiento.',
        icon: <BrainCircuitIcon className="h-5 w-5 text-primary" />,
        priority: 10
      });
    }
    
    // Ordenar recomendaciones por prioridad y limitar a 3
    const sortedRecommendations = generatedRecommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
    
    setRecommendations(sortedRecommendations);
    
  }, [statistics, recentExercises, exerciseTemplates]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Personalizadas</CardTitle>
          <CardDescription>
            Analizando tu historial de entrenamiento...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones Personalizadas</CardTitle>
          <CardDescription>
            Basadas en tu historial de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BrainCircuitIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Completa más entrenamientos para recibir recomendaciones personalizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones Personalizadas</CardTitle>
        <CardDescription>
          Basadas en tu historial de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <Card key={index}>
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                {recommendation.icon}
                <CardTitle className="text-base">{recommendation.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              
              {recommendation.suggestedWorkout && (
                <div className="mt-3 bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-sm">{recommendation.suggestedWorkout.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.suggestedWorkout.muscleGroups.map((group) => (
                          <Badge key={group} variant="outline" className="text-xs">
                            {group}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="text-xs">
                          {recommendation.suggestedWorkout.exerciseCount} ejercicios
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.suggestedWorkout.estimatedDuration} min
                        </Badge>
                      </div>
                    </div>
                    <Link href="/dashboard/workout/create">
                      <Button variant="ghost" size="sm" className="gap-1">
                        Crear
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/dashboard/workout/tracker">
          <Button variant="outline" className="gap-2">
            <DumbbellIcon className="h-4 w-4" />
            Iniciar nuevo entrenamiento
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
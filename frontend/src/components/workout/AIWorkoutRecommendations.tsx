"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DumbbellIcon, Loader2Icon, SparklesIcon, CalendarIcon, TimerIcon, HeartIcon } from "lucide-react";
import { AIWorkoutRecommendation, DifficultyLevel, MuscleGroup, WorkoutInsert, WorkoutExerciseInsert, WorkoutType } from "@/types/workout";
import { createWorkout } from "@/lib/workout";
import { useAuth } from "@/hooks/useAuth";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface AIWorkoutRecommendationsProps {
  onCreateWorkout: (value: boolean) => void;
}

export default function AIWorkoutRecommendations({ onCreateWorkout }: AIWorkoutRecommendationsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateWorkoutRecommendations, isLoading } = useAIAssistant();
  const router = useRouter();
  
  const [difficultyLevel, setDifficultyLevel] = useState<number>(1);
  const [duration, setDuration] = useState<number>(30);
  const [includeCardio, setIncludeCardio] = useState<boolean>(true);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
  const [workoutRecommendations, setWorkoutRecommendations] = useState<AIWorkoutRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Función para mapear el valor del slider de dificultad a un nivel de dificultad
  const getDifficultyLevelText = (value: number): DifficultyLevel => {
    switch (value) {
      case 0: return DifficultyLevel.BEGINNER;
      case 1: return DifficultyLevel.INTERMEDIATE;
      case 2: return DifficultyLevel.ADVANCED;
      default: return DifficultyLevel.INTERMEDIATE;
    }
  };
  
  const toggleMuscleGroup = (muscleGroup: MuscleGroup) => {
    if (selectedMuscleGroups.includes(muscleGroup)) {
      setSelectedMuscleGroups(selectedMuscleGroups.filter(mg => mg !== muscleGroup));
    } else {
      setSelectedMuscleGroups([...selectedMuscleGroups, muscleGroup]);
    }
  };
  
  const generateWorkoutRecommendationsHandler = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debe iniciar sesión para generar recomendaciones",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const difficultyLevelText = getDifficultyLevelText(difficultyLevel);
      
      const response = await generateWorkoutRecommendations({
        difficultyLevel: difficultyLevelText,
        muscleGroups: selectedMuscleGroups.length > 0 ? selectedMuscleGroups : Object.values(MuscleGroup),
        duration: duration,
        includeCardio: includeCardio
      });
      
      try {
        // Encontrar y extraer el JSON de la respuesta
        let jsonData = response.trim();
        
        console.log("Respuesta original recibida:", jsonData.slice(0, 200) + "...");
        
        // Eliminar cualquier backtick de markdown si existe
        if (jsonData.startsWith("```json") && jsonData.endsWith("```")) {
          jsonData = jsonData.substring(7, jsonData.length - 3).trim();
        } else if (jsonData.startsWith("```") && jsonData.endsWith("```")) {
          jsonData = jsonData.substring(3, jsonData.length - 3).trim();
        }
        
        // Si la respuesta contiene texto adicional, intentamos extraer solo el JSON
        if (jsonData.includes('[') && jsonData.includes(']')) {
          const startIndex = jsonData.indexOf('[');
          const endIndex = jsonData.lastIndexOf(']') + 1;
          if (startIndex >= 0 && endIndex > startIndex) {
            jsonData = jsonData.substring(startIndex, endIndex);
          }
        }
        
        console.log("JSON extraído:", jsonData);
        
        // Intentar parsear el JSON
        const parsedRecommendations = JSON.parse(jsonData) as AIWorkoutRecommendation[];
        
        // Verificar que sea un array válido
        if (!Array.isArray(parsedRecommendations) || parsedRecommendations.length === 0) {
          throw new Error("La respuesta no es un array válido de recomendaciones");
        }
        
        // Validar la estructura de cada recomendación
        parsedRecommendations.forEach(rec => {
          if (!rec.name || !rec.exercises || !Array.isArray(rec.exercises)) {
            throw new Error("Formato de recomendación inválido");
          }
        });
        
        setWorkoutRecommendations(parsedRecommendations);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        toast({
          title: "Error",
          description: "No se pudo procesar la respuesta de la IA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating workout recommendations:", error);
      toast({
        title: "Error",
        description: "Error al generar recomendaciones de entrenamiento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const createWorkoutFromRecommendation = async (recommendation: AIWorkoutRecommendation) => {
    if (!user?.id) return;
    
    try {
      const now = new Date();
      
      const newWorkout: WorkoutInsert = {
        user_id: user.id,
        name: recommendation.name,
        description: recommendation.description,
        workout_type: recommendation.workoutType as WorkoutType,
        duration_minutes: recommendation.estimatedDuration,
        date: now.toISOString(),
        muscle_groups: recommendation.muscleGroups,
        notes: recommendation.notes || ""
      };
      
      // Convertir ejercicios al formato esperado por la API
      const exercisesData = recommendation.exercises.map((exercise, index) => {
        // Convertir reps a número entero (si es un rango como "10-12", usar el valor máximo)
        let repsValue = exercise.reps;
        if (typeof repsValue === 'string') {
          // Verificar si es un rango (contiene un guion)
          if (String(repsValue).includes('-')) {
            // Extraer el valor máximo del rango
            const rangeParts = String(repsValue).split('-');
            repsValue = parseInt(rangeParts[1].trim());
          } else {
            // Si no es un rango pero sigue siendo string, convertir a número
            repsValue = parseInt(String(repsValue));
          }
        }
        
        return {
          name: exercise.name,
          sets: exercise.sets,
          reps: repsValue,
          rest_seconds: exercise.restSeconds,
          order_index: index,
          notes: exercise.notes || ""
        };
      });
      
      // Llamar a la función de creación de workout
      const result = await createWorkout(newWorkout, exercisesData as WorkoutExerciseInsert[]);
      
      // Casting para TypeScript
      const typedResult = result as unknown as { id: string; name: string };
      
      toast({
        title: "Éxito",
        description: "Entrenamiento creado a partir de la recomendación",
      });
      
      // Cerrar el diálogo de recomendaciones
      onCreateWorkout(false);
      
      // Redireccionar al detalle del nuevo entrenamiento
      router.push(`/dashboard/workout/${typedResult.id}`);
    } catch (error) {
      console.error("Error creating workout from recommendation:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el entrenamiento",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <span>Recomendaciones de Entrenamiento Personalizadas</span>
          </CardTitle>
          <CardDescription>
            Configura tus preferencias y la IA generará rutinas de entrenamiento adaptadas a tus necesidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Nivel de dificultad</h3>
                <Slider
                  min={0}
                  max={2}
                  step={1}
                  value={[difficultyLevel]}
                  onValueChange={(value) => setDifficultyLevel(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Principiante</span>
                  <span>Intermedio</span>
                  <span>Avanzado</span>
                </div>
              </div>
              
              <div>
                <h3 className="mb-2 font-medium">Duración aproximada (minutos)</h3>
                <Slider
                  min={15}
                  max={90}
                  step={5}
                  value={[duration]}
                  onValueChange={(value) => setDuration(value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>15 min</span>
                  <span>45 min</span>
                  <span>90 min</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-cardio" 
                  checked={includeCardio}
                  onCheckedChange={setIncludeCardio}
                />
                <Label htmlFor="include-cardio">Incluir cardio</Label>
              </div>
            </div>
            
            <div>
              <h3 className="mb-2 font-medium">Grupos musculares a trabajar</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MuscleGroup).map((muscleGroup) => (
                  <Button
                    key={muscleGroup}
                    variant={selectedMuscleGroups.includes(muscleGroup as MuscleGroup) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMuscleGroup(muscleGroup as MuscleGroup)}
                    className="justify-start"
                  >
                    {muscleGroup}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => generateWorkoutRecommendationsHandler()}
            disabled={isGenerating || isLoading}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Generando recomendaciones...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 h-4 w-4" />
                Generar Recomendaciones
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {workoutRecommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Rutinas Recomendadas</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {workoutRecommendations.map((recommendation, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle>{recommendation.name}</CardTitle>
                  <CardDescription>{recommendation.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      <DumbbellIcon className="h-3 w-3 mr-1" />
                      {recommendation.workoutType}
                    </Badge>
                    <Badge variant="outline">
                      <TimerIcon className="h-3 w-3 mr-1" />
                      {recommendation.estimatedDuration} min
                    </Badge>
                    <Badge variant="outline">
                      <HeartIcon className="h-3 w-3 mr-1" />
                      {recommendation.difficultyLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Ejercicios</h4>
                  <ul className="space-y-2">
                    {recommendation.exercises.map((exercise, i) => (
                      <li key={i} className="text-sm">
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-muted-foreground">
                          {exercise.sets} series × {exercise.reps} reps, {exercise.restSeconds}s descanso
                        </div>
                        {exercise.notes && (
                          <div className="text-xs italic mt-1">{exercise.notes}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {recommendation.notes && (
                    <div className="mt-4 text-sm">
                      <h4 className="font-medium mb-1">Notas:</h4>
                      <p className="text-muted-foreground">{recommendation.notes}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/20 px-4 py-3">
                  <Button
                    onClick={() => createWorkoutFromRecommendation(recommendation)}
                    className="w-full"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Crear Entrenamiento
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
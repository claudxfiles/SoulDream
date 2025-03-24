"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { createWorkout, getExerciseTemplates } from "@/lib/workout";
import { ExerciseTemplate, MuscleGroup, WorkoutType, WorkoutInsert, WorkoutExerciseInsert } from "@/types/workout";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Trash2Icon, PlusCircleIcon, PlayIcon, PauseIcon, SquareIcon, SaveIcon, DumbbellIcon, TimerIcon, ActivityIcon, RotateCcwIcon } from "lucide-react";

interface ExerciseSet {
  weight: number;
  reps: number;
  completed: boolean;
}

interface ActiveExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: ExerciseSet[];
  notes: string;
  restSeconds: number;
}

export default function WorkoutTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Estado para el entrenamiento activo
  const [workoutName, setWorkoutName] = useState<string>("");
  const [workoutType, setWorkoutType] = useState<WorkoutType>(WorkoutType.STRENGTH);
  const [workoutNotes, setWorkoutNotes] = useState<string | undefined>(undefined);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  
  // Estado para el temporizador
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState<number>(60);
  const [originalRestTime, setOriginalRestTime] = useState<number>(60);
  
  // Estado para el ejercicio seleccionado
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | "ALL" | "">("");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExerciseTemplate[]>([]);
  
  // Estado para el cronómetro de entrenamiento
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [caloriesBurned, setCaloriesBurned] = useState<number | undefined>(undefined);

  // Cargar plantillas de ejercicios
  useEffect(() => {
    const loadExerciseTemplates = async () => {
      try {
        const templates = await getExerciseTemplates();
        setExerciseTemplates(templates);
      } catch (error) {
        console.error("Error loading exercise templates:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las plantillas de ejercicios",
          variant: "destructive",
        });
      }
    };

    loadExerciseTemplates();
  }, [toast]);

  // Filtrar plantillas cuando cambia el grupo muscular seleccionado
  useEffect(() => {
    if (selectedMuscleGroup) {
      if (selectedMuscleGroup === "ALL") {
        // Si se selecciona "Todos", mostrar todas las plantillas
        setFilteredTemplates(exerciseTemplates);
      } else {
        // Filtrar por el grupo muscular seleccionado
        setFilteredTemplates(
          exerciseTemplates.filter(
            (template) => template.muscle_group === selectedMuscleGroup
          )
        );
      }
    } else {
      setFilteredTemplates(exerciseTemplates);
    }
  }, [selectedMuscleGroup, exerciseTemplates]);

  // Temporizador de descanso
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (restTimeRemaining === 0) {
      setIsTimerRunning(false);
      toast({
        title: "¡Tiempo de descanso terminado!",
        description: "Es hora de continuar con tu entrenamiento",
      });
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, restTimeRemaining, toast]);

  // Temporizador de duración del entrenamiento
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const durationInSeconds = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);
        setWorkoutDuration(durationInSeconds);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  const startWorkout = () => {
    if (!workoutName) {
      toast({
        title: "Nombre requerido",
        description: "Por favor, ingresa un nombre para tu entrenamiento",
        variant: "destructive",
      });
      return;
    }

    if (activeExercises.length === 0) {
      toast({
        title: "Sin ejercicios",
        description: "Añade al menos un ejercicio a tu entrenamiento",
        variant: "destructive",
      });
      return;
    }

    setWorkoutStartTime(new Date());
    setIsWorkoutActive(true);
  };

  const stopWorkout = () => {
    setIsWorkoutActive(false);
  };

  const startRestTimer = () => {
    setRestTimeRemaining(originalRestTime);
    setIsTimerRunning(true);
  };

  const pauseRestTimer = () => {
    setIsTimerRunning(false);
  };

  const resetRestTimer = () => {
    setRestTimeRemaining(originalRestTime);
    setIsTimerRunning(false);
  };

  const handleAddExercise = () => {
    if (!selectedExercise) {
      toast({
        title: "Ejercicio no seleccionado",
        description: "Por favor, selecciona un ejercicio",
        variant: "destructive",
      });
      return;
    }

    const selectedTemplate = exerciseTemplates.find(
      (template) => template.name === selectedExercise
    );

    if (!selectedTemplate) return;

    const newExercise: ActiveExercise = {
      name: selectedTemplate.name,
      muscleGroup: selectedTemplate.muscle_group as MuscleGroup,
      sets: Array(4).fill(null).map(() => ({ weight: 0, reps: 0, completed: false })),
      notes: "",
      restSeconds: 60,
    };

    setActiveExercises([...activeExercises, newExercise]);
    setSelectedExercise("");
    setSelectedMuscleGroup("");
  };

  const removeExercise = (index: number) => {
    const updatedExercises = [...activeExercises];
    updatedExercises.splice(index, 1);
    setActiveExercises(updatedExercises);
    
    // Actualizar el índice actual si es necesario
    if (currentExerciseIndex >= updatedExercises.length) {
      setCurrentExerciseIndex(Math.max(0, updatedExercises.length - 1));
    }
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...activeExercises];
    const exercise = { ...updatedExercises[exerciseIndex] };
    
    exercise.sets = [
      ...exercise.sets,
      { weight: 0, reps: 0, completed: false }
    ];
    
    updatedExercises[exerciseIndex] = exercise;
    setActiveExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...activeExercises];
    const exercise = { ...updatedExercises[exerciseIndex] };
    
    exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
    
    updatedExercises[exerciseIndex] = exercise;
    setActiveExercises(updatedExercises);

    // Actualizar el índice actual si es necesario
    if (currentSetIndex >= exercise.sets.length) {
      setCurrentSetIndex(Math.max(0, exercise.sets.length - 1));
    }
  };

  const updateSetWeight = (exerciseIndex: number, setIndex: number, weight: number) => {
    const updatedExercises = [...activeExercises];
    updatedExercises[exerciseIndex].sets[setIndex].weight = weight;
    setActiveExercises(updatedExercises);
  };

  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    const updatedExercises = [...activeExercises];
    updatedExercises[exerciseIndex].sets[setIndex].reps = reps;
    setActiveExercises(updatedExercises);
  };

  const toggleSetCompletion = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...activeExercises];
    const isCompleted = !updatedExercises[exerciseIndex].sets[setIndex].completed;
    
    updatedExercises[exerciseIndex].sets[setIndex].completed = isCompleted;
    setActiveExercises(updatedExercises);

    if (isCompleted) {
      // Si es el último set, pasar al siguiente ejercicio
      if (setIndex === updatedExercises[exerciseIndex].sets.length - 1) {
        if (exerciseIndex < updatedExercises.length - 1) {
          setCurrentExerciseIndex(exerciseIndex + 1);
          setCurrentSetIndex(0);
        }
      } else {
        // Pasar al siguiente set
        setCurrentSetIndex(setIndex + 1);
      }

      // Iniciar temporizador de descanso
      setRestTimeRemaining(updatedExercises[exerciseIndex].restSeconds);
      setOriginalRestTime(updatedExercises[exerciseIndex].restSeconds);
      setIsTimerRunning(true);
    }
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    const updatedExercises = [...activeExercises];
    updatedExercises[exerciseIndex].notes = notes;
    setActiveExercises(updatedExercises);
  };

  const updateExerciseRest = (exerciseIndex: number, seconds: number) => {
    const updatedExercises = [...activeExercises];
    updatedExercises[exerciseIndex].restSeconds = seconds;
    setActiveExercises(updatedExercises);
    
    if (exerciseIndex === currentExerciseIndex) {
      setOriginalRestTime(seconds);
    }
  };

  const saveWorkout = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar tu entrenamiento",
        variant: "destructive",
      });
      return;
    }

    // Verificar si hay datos válidos para guardar
    if (activeExercises.length === 0) {
      toast({
        title: "Sin ejercicios",
        description: "Añade al menos un ejercicio a tu entrenamiento",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date();
      const duration = workoutDuration > 0 ? workoutDuration / 60 : 0;

      // Crear objeto de inserción de entrenamiento
      const workoutData: WorkoutInsert = {
        user_id: user.id,
        name: workoutName || `Entrenamiento ${format(now, 'dd/MM/yyyy')}`,
        description: workoutNotes || undefined,
        date: format(now, 'yyyy-MM-dd'),
        duration_minutes: Math.round(duration),
        workout_type: workoutType,
        calories_burned: caloriesBurned || undefined,
        notes: workoutNotes || undefined,
        muscle_groups: selectedMuscleGroups.length > 0 ? selectedMuscleGroups : undefined
      };

      // Crear objetos de inserción de ejercicios
      const exercises = activeExercises.map((exercise, index) => {
        // Calcular valores promedio de los sets completados
        const completedSets = exercise.sets.filter(set => set.completed);
        const avgWeight = completedSets.length > 0
          ? completedSets.reduce((sum, set) => sum + set.weight, 0) / completedSets.length
          : 0;
        const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);

        return {
          name: exercise.name,
          sets: completedSets.length,
          reps: Math.round(totalReps / completedSets.length) || 0,
          weight: Math.round(avgWeight) || undefined,
          duration_seconds: undefined,
          rest_seconds: exercise.restSeconds,
          order_index: index,
          notes: exercise.notes || undefined
        };
      });

      // Guardar el entrenamiento
      const result = await createWorkout(workoutData, exercises);
      
      // Casting para TypeScript
      const typedResult = result as unknown as { id: string; name: string };

      toast({
        title: "¡Entrenamiento guardado!",
        description: `Tu entrenamiento "${typedResult.name}" ha sido guardado correctamente.`,
      });

      // Redireccionar a la página de detalles del entrenamiento
      router.push(`/dashboard/workout/${typedResult.id}`);
    } catch (error) {
      console.error("Error saving workout:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el entrenamiento",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rastreador de Entrenamiento</CardTitle>
          <CardDescription>
            Registra tu progreso en tiempo real durante tu entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Encabezado del entrenamiento */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workout-name">Nombre del entrenamiento</Label>
                <Input
                  id="workout-name"
                  placeholder="Ej: Entrenamiento de pecho y brazos"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  disabled={isWorkoutActive}
                />
              </div>
              <div>
                <Label htmlFor="workout-type">Tipo de entrenamiento</Label>
                <Select
                  value={workoutType}
                  onValueChange={(v) => setWorkoutType(v as WorkoutType)}
                  disabled={isWorkoutActive}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(WorkoutType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="workout-notes">Notas generales</Label>
              <Input
                id="workout-notes"
                placeholder="Añade notas sobre este entrenamiento"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Selector de ejercicios */}
          {!isWorkoutActive && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Añadir ejercicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Grupo muscular</Label>
                    <Select
                      value={selectedMuscleGroup}
                      onValueChange={(v) => setSelectedMuscleGroup(v as MuscleGroup | "ALL")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo muscular" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        {Object.values(MuscleGroup).map((group) => (
                          <SelectItem key={group} value={group}>
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ejercicio</Label>
                    <Select 
                      value={selectedExercise}
                      onValueChange={setSelectedExercise}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ejercicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.name}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  className="mt-4 w-full" 
                  onClick={handleAddExercise}
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Añadir ejercicio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de ejercicios */}
          {activeExercises.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Ejercicios ({activeExercises.length})</h3>
              <div className="space-y-4">
                {activeExercises.map((exercise, exerciseIndex) => (
                  <Card key={`${exercise.name}-${exerciseIndex}`} className={
                    isWorkoutActive && exerciseIndex === currentExerciseIndex 
                      ? "border-primary" 
                      : ""
                  }>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {exercise.muscleGroup}
                          </Badge>
                          {exercise.name}
                        </CardTitle>
                        {!isWorkoutActive && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeExercise(exerciseIndex)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      {/* Controles de descanso */}
                      {isWorkoutActive && exerciseIndex === currentExerciseIndex && (
                        <div className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <Label>Tiempo de descanso: {exercise.restSeconds}s</Label>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={resetRestTimer}
                              >
                                <RotateCcwIcon className="h-4 w-4" />
                              </Button>
                              {isTimerRunning ? (
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={pauseRestTimer}
                                >
                                  <PauseIcon className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={startRestTimer}
                                >
                                  <PlayIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            <Slider
                              value={[exercise.restSeconds]}
                              min={10}
                              max={180}
                              step={5}
                              onValueChange={(value) => updateExerciseRest(exerciseIndex, value[0])}
                            />
                          </div>
                          <div className="text-center text-lg font-semibold">
                            <TimerIcon className="inline-block h-4 w-4 mr-2" />
                            {restTimeRemaining}s
                          </div>
                        </div>
                      )}
                      
                      {/* Tabla de sets */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-muted-foreground font-medium">
                              <th className="text-left pb-2">Set</th>
                              <th className="text-center pb-2">Peso (kg)</th>
                              <th className="text-center pb-2">Reps</th>
                              <th className="text-center pb-2">Completado</th>
                              {!isWorkoutActive && <th className="pb-2"></th>}
                            </tr>
                          </thead>
                          <tbody>
                            {exercise.sets.map((set, setIndex) => (
                              <tr key={setIndex} className={
                                isWorkoutActive && 
                                exerciseIndex === currentExerciseIndex && 
                                setIndex === currentSetIndex 
                                  ? "bg-accent/30" 
                                  : ""
                              }>
                                <td className="py-2 text-left">{setIndex + 1}</td>
                                <td className="py-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={set.weight}
                                    onChange={(e) => updateSetWeight(
                                      exerciseIndex, 
                                      setIndex, 
                                      parseFloat(e.target.value) || 0
                                    )}
                                    className="h-8 text-center w-20 mx-auto"
                                  />
                                </td>
                                <td className="py-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={set.reps}
                                    onChange={(e) => updateSetReps(
                                      exerciseIndex, 
                                      setIndex, 
                                      parseInt(e.target.value) || 0
                                    )}
                                    className="h-8 text-center w-20 mx-auto"
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <Switch
                                    checked={set.completed}
                                    onCheckedChange={() => toggleSetCompletion(exerciseIndex, setIndex)}
                                    disabled={!isWorkoutActive}
                                  />
                                </td>
                                {!isWorkoutActive && (
                                  <td className="py-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => removeSet(exerciseIndex, setIndex)}
                                    >
                                      <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {!isWorkoutActive && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          <PlusCircleIcon className="h-4 w-4 mr-2" />
                          Añadir set
                        </Button>
                      )}

                      <div>
                        <Label htmlFor={`notes-${exerciseIndex}`}>Notas</Label>
                        <Input
                          id={`notes-${exerciseIndex}`}
                          placeholder="Añade notas sobre este ejercicio"
                          value={exercise.notes}
                          onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
            {!isWorkoutActive ? (
              <Button 
                onClick={startWorkout}
                disabled={activeExercises.length === 0}
                className="gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                Iniciar entrenamiento
              </Button>
            ) : (
              <Button 
                onClick={stopWorkout}
                variant="outline"
                className="gap-2"
              >
                <SquareIcon className="h-4 w-4" />
                Pausar entrenamiento
              </Button>
            )}
            
            {isWorkoutActive && (
              <div className="flex items-center gap-2 ml-4">
                <ActivityIcon className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{formatTime(workoutDuration)}</span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={saveWorkout}
            className="gap-2"
          >
            <SaveIcon className="h-4 w-4" />
            Guardar entrenamiento
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
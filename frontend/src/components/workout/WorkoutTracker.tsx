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
import { createWorkout, getExerciseTemplates, updateWorkout } from "@/lib/workout";
import { ExerciseTemplate, MuscleGroup, WorkoutType, WorkoutInsert, WorkoutExerciseInsert } from "@/types/workout";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Trash2Icon, PlusCircleIcon, PlayIcon, PauseIcon, SquareIcon, SaveIcon, DumbbellIcon, TimerIcon, ActivityIcon, RotateCcwIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface WorkoutTrackerProps {
  initialWorkout?: {
    id: string;
    name: string;
    type: WorkoutType;
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      weight?: number;
      duration_seconds?: number;
      distance?: number;
      units?: string;
      rest_seconds: number;
      notes?: string;
      muscle_group?: MuscleGroup;
    }>;
  } | null;
}

export default function WorkoutTracker({ initialWorkout }: WorkoutTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Estado para el entrenamiento activo
  const [workoutId, setWorkoutId] = useState<string | undefined>(initialWorkout?.id);
  const [workoutName, setWorkoutName] = useState<string>(initialWorkout?.name || "");
  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    initialWorkout?.type || WorkoutType.STRENGTH
  );
  const [workoutNotes, setWorkoutNotes] = useState<string>("");
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
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);

  // Inicializar ejercicios si hay datos iniciales
  useEffect(() => {
    if (initialWorkout?.exercises) {
      const exercises: ActiveExercise[] = initialWorkout.exercises.map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscle_group || MuscleGroup.FULL_BODY,
        sets: Array(ex.sets).fill(null).map(() => ({
          weight: ex.weight || 0,
          reps: ex.reps || 0,
          completed: false
        })),
        notes: ex.notes || "",
        restSeconds: ex.rest_seconds || 60
      }));
      setActiveExercises(exercises);
      
      // Actualizar el nombre y tipo del entrenamiento
      if (initialWorkout.name) {
        setWorkoutName(initialWorkout.name);
      }
      if (initialWorkout.type) {
        setWorkoutType(initialWorkout.type);
      }
      // Guardar el ID del entrenamiento si existe
      if (initialWorkout.id) {
        setWorkoutId(initialWorkout.id);
      }
    }
  }, [initialWorkout]);

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

    // Añadir el nuevo ejercicio al array existente
    setActiveExercises(prevExercises => [...prevExercises, newExercise]);

    // Si hay un entrenamiento activo, actualizarlo inmediatamente
    if (workoutId && user?.id) {
      const exerciseData = {
        workout_id: workoutId,
        name: newExercise.name,
        sets: 4,
        reps: 0,
        rest_seconds: 60,
        order_index: activeExercises.length,
        notes: ""
      };

      // Actualizar el entrenamiento con el nuevo ejercicio
      updateWorkout(workoutId, {}, [...activeExercises.map((ex, index) => ({
        workout_id: workoutId,
        name: ex.name,
        sets: ex.sets.length,
        reps: 0,
        rest_seconds: ex.restSeconds,
        order_index: index,
        notes: ex.notes
      })), exerciseData]);
    }

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

      // Pre-calcular los ejercicios para evitar cálculos repetitivos
      const exercises = activeExercises.map((exercise, index) => {
        const completedSets = exercise.sets.filter(set => set.completed);
        const totalWeight = completedSets.reduce((sum, set) => sum + set.weight, 0);
        const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
        const completedSetsCount = completedSets.length;

        const baseExercise = {
          name: exercise.name,
          sets: completedSetsCount,
          reps: completedSetsCount > 0 ? Math.round(totalReps / completedSetsCount) : 0,
          weight: completedSetsCount > 0 ? Math.round(totalWeight / completedSetsCount) : undefined,
          duration_seconds: undefined,
          rest_seconds: exercise.restSeconds,
          order_index: index,
          notes: exercise.notes || undefined
        };

        return workoutId ? { ...baseExercise, workout_id: workoutId } : baseExercise;
      });

      // Preparar datos del workout una sola vez
      const workoutData = {
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

      let result;
      if (workoutId) {
        await updateWorkout(workoutId, workoutData, exercises as WorkoutExerciseInsert[]);
        result = { id: workoutId, name: workoutName };
      } else {
        result = await createWorkout(workoutData, exercises as WorkoutExerciseInsert[]);
      }

      if (!result?.id) {
        throw new Error('No se pudo obtener el ID del entrenamiento');
      }

      toast({
        title: workoutId ? "¡Entrenamiento actualizado!" : "¡Entrenamiento guardado!",
        description: `Tu entrenamiento "${workoutName}" ha sido ${workoutId ? 'actualizado' : 'guardado'} correctamente.`,
      });

      router.push(`/dashboard/workout/${result.id}`);
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
        <CardContent>
          <Tabs defaultValue={isWorkoutActive ? "workout" : "setup"} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup" disabled={isWorkoutActive}>
                <DumbbellIcon className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="workout">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Entrenamiento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-6">
              {/* Paso 1: Configuración básica */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Configuración Básica</CardTitle>
                      <CardDescription>Define los detalles de tu entrenamiento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Paso 2: Añadir ejercicios */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Añadir Ejercicios</CardTitle>
                      <CardDescription>Selecciona los ejercicios para tu entrenamiento</CardDescription>
                    </div>
                  </div>
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

              {/* Lista de ejercicios configurados */}
              {activeExercises.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">3</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">Ejercicios Configurados</CardTitle>
                        <CardDescription>Revisa y ajusta los ejercicios añadidos</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeExercises.map((exercise, exerciseIndex) => (
                        <Card key={`${exercise.name}-${exerciseIndex}`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Badge variant="outline" className="font-normal">
                                  {exercise.muscleGroup}
                                </Badge>
                                {exercise.name}
                              </CardTitle>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeExercise(exerciseIndex)}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3 space-y-3">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="text-xs text-muted-foreground font-medium">
                                    <th className="text-left pb-2">Set</th>
                                    <th className="text-center pb-2">Peso (kg)</th>
                                    <th className="text-center pb-2">Reps</th>
                                    <th className="pb-2"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, setIndex) => (
                                    <tr key={setIndex}>
                                      <td className="py-2 text-left">{setIndex + 1}</td>
                                      <td className="py-2">
                                        <Input
                                          type="number"
                                          min={0}
                                          value={set.weight || 0}
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
                                          value={set.reps || 0}
                                          onChange={(e) => updateSetReps(
                                            exerciseIndex, 
                                            setIndex, 
                                            parseInt(e.target.value) || 0
                                          )}
                                          className="h-8 text-center w-20 mx-auto"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => removeSet(exerciseIndex, setIndex)}
                                        >
                                          <Trash2Icon className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addSet(exerciseIndex)}
                            >
                              <PlusCircleIcon className="h-4 w-4 mr-2" />
                              Añadir set
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="workout" className="space-y-6">
              {activeExercises.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <DumbbellIcon className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-medium text-muted-foreground">
                      No hay ejercicios configurados
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Añade ejercicios en la pestaña de configuración para comenzar
                    </p>
                  </CardContent>
                </Card>
              ) : !isWorkoutActive ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Button 
                      size="lg"
                      className="gap-2"
                      onClick={() => setIsWorkoutActive(true)}
                    >
                      <PlayIcon className="h-5 w-5" />
                      Iniciar Entrenamiento
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Panel de progreso */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Ejercicio</p>
                            <p className="text-2xl font-bold">{currentExerciseIndex + 1}/{activeExercises.length}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Serie</p>
                            <p className="text-2xl font-bold">
                              {currentSetIndex + 1}/{activeExercises[currentExerciseIndex]?.sets.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Tiempo</p>
                            <p className="text-2xl font-bold">{formatTime(workoutDuration)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive"
                          size="lg"
                          className="gap-2"
                          onClick={() => setIsWorkoutActive(false)}
                        >
                          <SquareIcon className="h-5 w-5" />
                          Finalizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ejercicio actual */}
                  <Card className="border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {activeExercises[currentExerciseIndex]?.muscleGroup}
                        </Badge>
                        {activeExercises[currentExerciseIndex]?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Temporizador de descanso */}
                      {isTimerRunning && (
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-16">
                                <svg className="transform -rotate-90 h-16 w-16">
                                  <circle
                                    className="text-muted-foreground/20 stroke-current"
                                    strokeWidth="4"
                                    fill="none"
                                    r="30"
                                    cx="32"
                                    cy="32"
                                  />
                                  <circle
                                    className="text-primary stroke-current"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="none"
                                    r="30"
                                    cx="32"
                                    cy="32"
                                    strokeDasharray={`${(restTimeRemaining / originalRestTime) * 188.4} 188.4`}
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                                  {restTimeRemaining}s
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">Tiempo de descanso</p>
                                <p className="text-sm text-muted-foreground">
                                  Siguiente serie: {currentSetIndex + 2}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                              >
                                {isTimerRunning ? (
                                  <PauseIcon className="h-4 w-4" />
                                ) : (
                                  <PlayIcon className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setRestTimeRemaining(originalRestTime)}
                              >
                                <RotateCcwIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Slider
                            value={[activeExercises[currentExerciseIndex]?.restSeconds || 60]}
                            min={10}
                            max={180}
                            step={5}
                            className="mt-4"
                            onValueChange={(value) => updateExerciseRest(currentExerciseIndex, value[0])}
                          />
                        </div>
                      )}

                      {/* Series del ejercicio actual */}
                      <div className="space-y-2">
                        {activeExercises[currentExerciseIndex]?.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className={cn(
                              "p-4 rounded-lg border",
                              setIndex === currentSetIndex
                                ? "border-primary bg-primary/5"
                                : set.completed
                                ? "border-green-200 bg-green-50/30"
                                : "border-muted bg-card"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <span className="font-medium">{setIndex + 1}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <Label>Peso (kg)</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={set.weight || 0}
                                      onChange={(e) => updateSetWeight(
                                        currentExerciseIndex,
                                        setIndex,
                                        parseFloat(e.target.value) || 0
                                      )}
                                      className="h-8 w-20"
                                    />
                                  </div>
                                  <div>
                                    <Label>Reps</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={set.reps || 0}
                                      onChange={(e) => updateSetReps(
                                        currentExerciseIndex,
                                        setIndex,
                                        parseInt(e.target.value) || 0
                                      )}
                                      className="h-8 w-20"
                                    />
                                  </div>
                                </div>
                              </div>
                              {setIndex === currentSetIndex ? (
                                <Button
                                  size="lg"
                                  className="gap-2"
                                  onClick={() => toggleSetCompletion(currentExerciseIndex, setIndex)}
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                  Completar Serie
                                </Button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {set.completed ? (
                                    <Badge variant="success" className="gap-1">
                                      <CheckCircleIcon className="h-3 w-3" />
                                      Completado
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1">
                                      Pendiente
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
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
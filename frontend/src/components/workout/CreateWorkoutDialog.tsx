"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createWorkout, getExerciseTemplates } from "@/lib/workout";
import { WorkoutType, ExerciseTemplate, MuscleGroup } from "@/types/workout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { CalendarIcon, PlusIcon, Trash2Icon, DumbbellIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase, supabaseClient } from "@/lib/supabase";
import WorkoutMuscleSelector from "./WorkoutMuscleSelector";

interface CreateWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateWorkoutDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkoutDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [date, setDate] = useState<Date>(new Date());
  const [name, setName] = useState<string>("");
  const [workoutType, setWorkoutType] = useState<string>(WorkoutType.STRENGTH);
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Array<{
    name: string;
    sets: number;
    reps: number | null;
    weight: number | null;
    notes: string | null;
  }>>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);

  useEffect(() => {
    const loadExerciseTemplates = async () => {
      try {
        const templates = await getExerciseTemplates();
        setExerciseTemplates(templates);
      } catch (error) {
        console.error("Error loading exercise templates:", error);
      }
    };

    if (open) {
      loadExerciseTemplates();
    }
  }, [open]);

  const resetForm = () => {
    setDate(new Date());
    setName("");
    setWorkoutType(WorkoutType.STRENGTH);
    setDuration("");
    setNotes("");
    setMuscleGroups([]);
    setExercises([]);
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        sets: 3,
        reps: 10,
        weight: null,
        notes: null,
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    setExercises(newExercises);
  };

  const handleExerciseChange = (index: number, field: string, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: value,
    };
    setExercises(newExercises);
  };

  const handleMuscleGroupsChange = (selected: string[]) => {
    setMuscleGroups(selected);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validación
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Por favor, añade un nombre para el entrenamiento",
        variant: "destructive",
      });
      return;
    }

    if (exercises.length === 0) {
      toast({
        title: "Error",
        description: "Por favor, añade al menos un ejercicio",
        variant: "destructive",
      });
      return;
    }

    // Validar que todos los ejercicios tengan nombre
    for (const exercise of exercises) {
      if (!exercise.name.trim()) {
        toast({
          title: "Error",
          description: "Todos los ejercicios deben tener un nombre",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Primero crear el workout y obtener su ID
      const workoutData = {
        user_id: user.id,
        name,
        date: format(date, "yyyy-MM-dd"),
        workout_type: workoutType,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes || null,
        muscle_groups: muscleGroups.length > 0 ? muscleGroups : null,
      };

      // Usar supabaseClient en lugar de supabase para asegurar que tenemos la sesión
      const { data: createdWorkout, error: workoutError } = await supabaseClient
        .from('workouts')
        .insert(workoutData)
        .select()
        .single();

      if (workoutError || !createdWorkout) {
        throw workoutError || new Error("No se pudo crear el entrenamiento");
      }

      // Ahora que tenemos el ID del workout, mapeamos los ejercicios con el workout_id
      const exercisesWithWorkoutId = exercises.map((exercise, index) => ({
        workout_id: createdWorkout.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        duration_seconds: null,
        distance: null,
        units: null,
        notes: exercise.notes,
        order_index: index
      }));

      // Insertar los ejercicios - también usando supabaseClient
      const { error: exercisesError } = await supabaseClient
        .from('workout_exercises')
        .insert(exercisesWithWorkoutId);

      if (exercisesError) {
        // Eliminar el workout si hay error al insertar ejercicios
        await supabaseClient.from('workouts').delete().eq('id', createdWorkout.id);
        throw exercisesError;
      }

      toast({
        title: "Entrenamiento creado",
        description: "Tu entrenamiento ha sido registrado correctamente",
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating workout:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el entrenamiento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exerciseNameSuggestions = exerciseTemplates.map(t => t.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Entrenamiento</DialogTitle>
          <DialogDescription>
            Registra tu sesión de entrenamiento con los ejercicios realizados
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del entrenamiento</Label>
              <Input
                id="name"
                placeholder="Ej: Día de piernas"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de entrenamiento</Label>
              <Select value={workoutType} onValueChange={setWorkoutType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WorkoutType.STRENGTH}>Fuerza</SelectItem>
                  <SelectItem value={WorkoutType.CARDIO}>Cardio</SelectItem>
                  <SelectItem value={WorkoutType.FLEXIBILITY}>Flexibilidad</SelectItem>
                  <SelectItem value={WorkoutType.HIIT}>HIIT</SelectItem>
                  <SelectItem value={WorkoutType.YOGA}>Yoga</SelectItem>
                  <SelectItem value={WorkoutType.PILATES}>Pilates</SelectItem>
                  <SelectItem value={WorkoutType.CROSSFIT}>CrossFit</SelectItem>
                  <SelectItem value={WorkoutType.CUSTOM}>Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Ej: 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Grupos musculares trabajados</Label>
            <WorkoutMuscleSelector
              selected={muscleGroups}
              onChange={handleMuscleGroupsChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Añade notas o comentarios sobre tu entrenamiento"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ejercicios</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExercise}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Añadir ejercicio
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <DumbbellIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">
                  Añade ejercicios a tu entrenamiento
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="border p-4 rounded-lg space-y-3 relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`exercise-name-${index}`}>Nombre</Label>
                        <Input
                          id={`exercise-name-${index}`}
                          placeholder="Ej: Press de banca"
                          value={exercise.name}
                          onChange={(e) =>
                            handleExerciseChange(index, "name", e.target.value)
                          }
                          list={`exercises-list-${index}`}
                        />
                        <datalist id={`exercises-list-${index}`}>
                          {exerciseNameSuggestions.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-sets-${index}`}>Series</Label>
                          <Input
                            id={`exercise-sets-${index}`}
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "sets",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-reps-${index}`}>Reps</Label>
                          <Input
                            id={`exercise-reps-${index}`}
                            type="number"
                            min="0"
                            value={exercise.reps ?? ""}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "reps",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`exercise-weight-${index}`}>Peso (kg)</Label>
                          <Input
                            id={`exercise-weight-${index}`}
                            type="number"
                            min="0"
                            step="0.5"
                            value={exercise.weight ?? ""}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "weight",
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`exercise-notes-${index}`}>Notas</Label>
                      <Input
                        id={`exercise-notes-${index}`}
                        placeholder="Notas adicionales"
                        value={exercise.notes ?? ""}
                        onChange={(e) =>
                          handleExerciseChange(
                            index,
                            "notes",
                            e.target.value || null
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? "Guardando..." : "Guardar entrenamiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
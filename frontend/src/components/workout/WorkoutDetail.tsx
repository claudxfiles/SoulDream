"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeftIcon,
  DumbbellIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  StickyNoteIcon,
  Trash2Icon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BookmarkIcon
} from "lucide-react";
import { getWorkoutWithExercises, deleteWorkout, updateWorkout } from "@/lib/workout";
import { WorkoutWithExercises, WorkoutType, WorkoutExerciseInsert, muscleGroupImages, MuscleGroup } from "@/types/workout";
import { useAuth } from "@/hooks/useAuth";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, MinusIcon } from "lucide-react";
import WorkoutMuscleSelector from "./WorkoutMuscleSelector";
import CreateWorkoutDialog from "./CreateWorkoutDialog";

interface WorkoutDetailProps {
  id: string;
}

function MuscleGroupsDisplay({ muscleGroups }: { muscleGroups: string[] }) {
  if (!muscleGroups || muscleGroups.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No hay grupos musculares registrados
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {muscleGroups.map((muscleId) => {
        const imgSrc = muscleGroupImages[muscleId];
        const name = Object.entries(MuscleGroup).find(
          ([key, value]) => value === muscleId
        )?.[0];
        
        return (
          <div
            key={muscleId}
            className="flex flex-col items-center border rounded-lg p-3 bg-background"
          >
            <div className="relative w-12 h-12 mb-1">
              {imgSrc && (
                <Image
                  src={imgSrc}
                  alt={name || muscleId}
                  fill
                  sizes="100%"
                  style={{ objectFit: "contain" }}
                />
              )}
            </div>
            <span className="text-xs font-medium text-center">
              {name || muscleId}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkoutDetail({ id }: WorkoutDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  
  // Estado para el formulario de edición
  const [editData, setEditData] = useState({
    name: "",
    date: "",
    workout_type: "",
    duration_minutes: 0,
    notes: "",
    muscle_groups: [] as string[]
  });
  
  // Modificando el tipo para usar un tipo parcial que no requiera workout_id al inicializar
  const [exercises, setExercises] = useState<Partial<WorkoutExerciseInsert>[]>([]);

  useEffect(() => {
    // Si el ID es "new", mostrar el diálogo de creación en lugar de cargar un entrenamiento
    if (id === "new") {
      setIsLoading(false);
      setShowCreateDialog(true);
      return;
    }
    
    const loadWorkout = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const workoutData = await getWorkoutWithExercises(id);
        setWorkout(workoutData);
        
        // Inicializar el formulario de edición
        if (workoutData) {
          setEditData({
            name: workoutData.name || "",
            date: format(new Date(workoutData.date), 'yyyy-MM-dd'),
            workout_type: workoutData.workout_type || "",
            duration_minutes: workoutData.duration_minutes || 0,
            notes: workoutData.notes || "",
            muscle_groups: workoutData.muscle_groups || []
          });
          
          // Inicializar los ejercicios con casting para evitar errores de TypeScript
          setExercises(workoutData.exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration_seconds: exercise.duration_seconds,
            distance: exercise.distance,
            units: exercise.units,
            notes: exercise.notes
          })));
        }
      } catch (error) {
        console.error("Error loading workout:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el entrenamiento",
          variant: "destructive",
        });
        router.push("/dashboard/workout");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkout();
  }, [id, toast, router]);

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkout(id);
      toast({
        title: "Entrenamiento eliminado",
        description: "El entrenamiento ha sido eliminado correctamente",
      });
      router.push("/dashboard/workout");
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el entrenamiento",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!user || !workout) return;
    
    if (!editData.name) {
      toast({
        title: "Error",
        description: "El nombre del entrenamiento es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    if (exercises.length === 0) {
      toast({
        title: "Error",
        description: "Debes añadir al menos un ejercicio",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedWorkout = {
        id: workout.id,
        user_id: user.id,
        name: editData.name,
        date: editData.date,
        workout_type: editData.workout_type,
        duration_minutes: editData.duration_minutes,
        notes: editData.notes,
        muscle_groups: editData.muscle_groups.length ? editData.muscle_groups : null
      };
      
      await updateWorkout(
        id,
        updatedWorkout,
        exercises as WorkoutExerciseInsert[]
      );
      
      // Recargar los datos del workout
      const updatedWorkoutData = await getWorkoutWithExercises(id);
      setWorkout(updatedWorkoutData);
      
      toast({
        title: "Entrenamiento actualizado",
        description: "El entrenamiento ha sido actualizado correctamente",
      });
      
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating workout:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el entrenamiento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExerciseChange = (index: number, field: string, value: any) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as Partial<WorkoutExerciseInsert>;
      return updated;
    });
  };

  const addExercise = () => {
    setExercises(prev => [
      ...prev,
      {
        name: "",
        sets: 1,
        reps: null,
        weight: null,
        duration_seconds: null,
        distance: null,
        units: null,
        notes: null
      } as Partial<WorkoutExerciseInsert>
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const renderWorkoutTypeLabel = (type: string | null) => {
    if (!type) return "Otro";
    
    switch (type) {
      case WorkoutType.STRENGTH:
        return "Fuerza";
      case WorkoutType.CARDIO:
        return "Cardio";
      case WorkoutType.FLEXIBILITY:
        return "Flexibilidad";
      case WorkoutType.HIIT:
        return "HIIT";
      case WorkoutType.YOGA:
        return "Yoga";
      case WorkoutType.PILATES:
        return "Pilates";
      case WorkoutType.CROSSFIT:
        return "CrossFit";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getWorkoutTypeBadgeColor = (type: string | null) => {
    if (!type) return "bg-gray-500";
    
    switch (type) {
      case WorkoutType.STRENGTH:
        return "bg-red-500";
      case WorkoutType.CARDIO:
        return "bg-blue-500";
      case WorkoutType.FLEXIBILITY:
        return "bg-purple-500";
      case WorkoutType.HIIT:
        return "bg-orange-500";
      case WorkoutType.YOGA:
        return "bg-green-500";
      case WorkoutType.PILATES:
        return "bg-pink-500";
      case WorkoutType.CROSSFIT:
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleMuscleGroupsChange = (selected: string[]) => {
    setEditData({
      ...editData,
      muscle_groups: selected
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    router.push("/dashboard/workout");
  };

  if (id === "new") {
    return (
      <CreateWorkoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Button 
          variant="ghost" 
          className="w-fit"
          onClick={() => router.push("/dashboard/workout")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="flex flex-col gap-6">
        <Button 
          variant="ghost" 
          className="w-fit"
          onClick={() => router.push("/dashboard/workout")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Entrenamiento no encontrado</CardTitle>
            <CardDescription>
              El entrenamiento que estás buscando no existe o ha sido eliminado
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/workout")}>
              Ver entrenamientos
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => router.push("/dashboard/workout")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleEdit}
          >
            <EditIcon className="h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2Icon className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{workout.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(workout.date), "PPPP", { locale: es })}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${getWorkoutTypeBadgeColor(workout.workout_type)} text-white`}>
              {renderWorkoutTypeLabel(workout.workout_type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <ClockIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="font-medium">
                  {workout.duration_minutes ? `${workout.duration_minutes} minutos` : "No especificada"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <DumbbellIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ejercicios</p>
                <p className="font-medium">{workout.exercises.length} ejercicios</p>
              </div>
            </div>
          </div>

          {workout.notes && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <StickyNoteIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Notas</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                    {workout.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <BookmarkIcon className="h-5 w-5 text-primary" />
              Ejercicios
            </h3>
            
            {workout.exercises.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <AlertTriangleIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">
                  No hay ejercicios registrados para este entrenamiento
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workout.exercises.map((exercise, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            {exercise.name}
                          </h4>
                          {exercise.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Series</p>
                            <p className="font-medium">{exercise.sets}</p>
                          </div>
                          {exercise.reps !== null && (
                            <div>
                              <p className="text-muted-foreground">Reps</p>
                              <p className="font-medium">{exercise.reps}</p>
                            </div>
                          )}
                          {exercise.weight !== null && (
                            <div>
                              <p className="text-muted-foreground">Peso</p>
                              <p className="font-medium">{exercise.weight} kg</p>
                            </div>
                          )}
                          {exercise.duration_seconds !== null && (
                            <div>
                              <p className="text-muted-foreground">Duración</p>
                              <p className="font-medium">{exercise.duration_seconds} seg</p>
                            </div>
                          )}
                          {exercise.distance !== null && (
                            <div>
                              <p className="text-muted-foreground">Distancia</p>
                              <p className="font-medium">
                                {exercise.distance} {exercise.units || 'm'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <DumbbellIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Grupos musculares trabajados</span>
            </div>
            <MuscleGroupsDisplay muscleGroups={workout.muscle_groups || []} />
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el entrenamiento y todos sus ejercicios.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Entrenamiento</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de tu entrenamiento y ejercicios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  value={editData.name}
                  onChange={handleInputChange}
                  placeholder="Nombre del entrenamiento"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={editData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workout_type">Tipo de Entrenamiento</Label>
                <Select
                  value={editData.workout_type}
                  onValueChange={(value) => 
                    setEditData(prev => ({ ...prev, workout_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WorkoutType.STRENGTH}>Fuerza</SelectItem>
                    <SelectItem value={WorkoutType.CARDIO}>Cardio</SelectItem>
                    <SelectItem value={WorkoutType.FLEXIBILITY}>Flexibilidad</SelectItem>
                    <SelectItem value={WorkoutType.HIIT}>HIIT</SelectItem>
                    <SelectItem value={WorkoutType.YOGA}>Yoga</SelectItem>
                    <SelectItem value={WorkoutType.PILATES}>Pilates</SelectItem>
                    <SelectItem value={WorkoutType.CROSSFIT}>CrossFit</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="0"
                  value={editData.duration_minutes || ""}
                  onChange={handleInputChange}
                  placeholder="Duración en minutos"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={editData.notes || ""}
                onChange={handleInputChange}
                placeholder="Notas adicionales sobre el entrenamiento"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Grupos musculares trabajados</Label>
              <WorkoutMuscleSelector
                selected={editData.muscle_groups}
                onChange={handleMuscleGroupsChange}
              />
            </div>
            
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-medium">Ejercicios</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addExercise}
                  className="gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Añadir ejercicio
                </Button>
              </div>
              
              {exercises.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    No hay ejercicios. Haz clic en "Añadir ejercicio" para comenzar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between mb-3">
                          <h5 className="font-medium">Ejercicio {index + 1}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(index)}
                            className="h-8 w-8 p-0"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-name-${index}`}>Nombre</Label>
                            <Input
                              id={`exercise-name-${index}`}
                              value={exercise.name}
                              onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                              placeholder="Nombre del ejercicio"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-sets-${index}`}>Series</Label>
                            <Input
                              id={`exercise-sets-${index}`}
                              type="number"
                              min="1"
                              value={exercise.sets || 1}
                              onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 1)}
                              placeholder="Número de series"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-3 mt-3">
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-reps-${index}`}>Repeticiones</Label>
                            <Input
                              id={`exercise-reps-${index}`}
                              type="number"
                              min="0"
                              value={exercise.reps || ""}
                              onChange={(e) => handleExerciseChange(index, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Reps"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-weight-${index}`}>Peso (kg)</Label>
                            <Input
                              id={`exercise-weight-${index}`}
                              type="number"
                              min="0"
                              step="0.5"
                              value={exercise.weight || ""}
                              onChange={(e) => handleExerciseChange(index, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Peso"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-duration-${index}`}>Duración (seg)</Label>
                            <Input
                              id={`exercise-duration-${index}`}
                              type="number"
                              min="0"
                              value={exercise.duration_seconds || ""}
                              onChange={(e) => handleExerciseChange(index, 'duration_seconds', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="Duración"
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mt-3">
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-distance-${index}`}>Distancia</Label>
                            <Input
                              id={`exercise-distance-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={exercise.distance || ""}
                              onChange={(e) => handleExerciseChange(index, 'distance', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Distancia"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-units-${index}`}>Unidades</Label>
                            <Input
                              id={`exercise-units-${index}`}
                              value={exercise.units || ""}
                              onChange={(e) => handleExerciseChange(index, 'units', e.target.value || null)}
                              placeholder="Ej: m, km, millas"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Label htmlFor={`exercise-notes-${index}`}>Notas</Label>
                          <Textarea
                            id={`exercise-notes-${index}`}
                            value={exercise.notes || ""}
                            onChange={(e) => handleExerciseChange(index, 'notes', e.target.value || null)}
                            placeholder="Notas adicionales sobre el ejercicio"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
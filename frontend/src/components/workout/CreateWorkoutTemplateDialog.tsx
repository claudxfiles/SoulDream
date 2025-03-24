import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createWorkoutTemplate,
  updateWorkoutTemplate,
} from "@/lib/workout";
import {
  WorkoutTemplate,
  WorkoutType,
  MuscleGroup,
  WorkoutTemplateExercise,
} from "@/types/workout";

interface CreateWorkoutTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingTemplate?: WorkoutTemplate | null;
}

export default function CreateWorkoutTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  editingTemplate,
}: CreateWorkoutTemplateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkoutTemplate>>({
    name: "",
    description: "",
    workout_type: "",
    muscle_groups: [],
    estimated_duration: 0,
    is_public: false,
  });
  const [exercises, setExercises] = useState<Partial<WorkoutTemplateExercise>[]>([]);

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        description: editingTemplate.description,
        workout_type: editingTemplate.workout_type,
        muscle_groups: editingTemplate.muscle_groups,
        estimated_duration: editingTemplate.estimated_duration,
        is_public: editingTemplate.is_public,
      });
      // Cargar ejercicios si están disponibles
      if (editingTemplate.exercises) {
        setExercises(editingTemplate.exercises);
      }
    } else {
      resetForm();
    }
  }, [editingTemplate]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      workout_type: "",
      muscle_groups: [],
      estimated_duration: 0,
      is_public: false,
    });
    setExercises([]);
  };

  const handleSubmit = async () => {
    if (!user?.id || !formData.name || !formData.workout_type) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTemplate) {
        await updateWorkoutTemplate(editingTemplate.id, {
          ...formData,
          exercises,
        } as WorkoutTemplate);
        toast({
          title: "Plantilla actualizada",
          description: "La plantilla se ha actualizado correctamente",
        });
      } else {
        await createWorkoutTemplate({
          ...formData,
          user_id: user.id,
          exercises,
        } as WorkoutTemplate);
        toast({
          title: "Plantilla creada",
          description: "La plantilla se ha creado correctamente",
        });
      }

      onSuccess();
      resetForm();
    } catch (error) {
      console.error("Error saving workout template:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la plantilla",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        sets: 3,
        reps: 12,
        rest_seconds: 60,
        notes: "",
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setExercises(updatedExercises);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
          </DialogTitle>
          <DialogDescription>
            {editingTemplate
              ? "Modifica los detalles de la plantilla de entrenamiento"
              : "Crea una nueva plantilla de entrenamiento predefinida"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nombre de la plantilla"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe el objetivo y características de esta rutina"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout_type">Tipo de Entrenamiento</Label>
              <Select
                value={formData.workout_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, workout_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WorkoutType).map(([name, value]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grupos Musculares</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MuscleGroup).map(([name, value]) => (
                <Button
                  key={value}
                  type="button"
                  variant={
                    formData.muscle_groups?.includes(value)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const groups = formData.muscle_groups || [];
                    setFormData({
                      ...formData,
                      muscle_groups: groups.includes(value)
                        ? groups.filter((g) => g !== value)
                        : [...groups, value],
                    });
                  }}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ejercicios</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExercise}
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar Ejercicio
              </Button>
            </div>

            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-4 items-start border p-4 rounded-lg"
                >
                  <div className="col-span-6 space-y-2">
                    <Label>Nombre del Ejercicio</Label>
                    <Input
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(index, "name", e.target.value)
                      }
                      placeholder="Ej: Press de Banca"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Series</Label>
                    <Input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) =>
                        updateExercise(index, "sets", parseInt(e.target.value))
                      }
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Repeticiones</Label>
                    <Input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) =>
                        updateExercise(index, "reps", parseInt(e.target.value))
                      }
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descanso (seg)</Label>
                    <Input
                      type="number"
                      value={exercise.rest_seconds}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          "rest_seconds",
                          parseInt(e.target.value)
                        )
                      }
                      min="0"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Notas</Label>
                    <Input
                      value={exercise.notes}
                      onChange={(e) =>
                        updateExercise(index, "notes", e.target.value)
                      }
                      placeholder="Instrucciones adicionales"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(index)}
                    className="mt-8"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : editingTemplate
              ? "Guardar Cambios"
              : "Crear Plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
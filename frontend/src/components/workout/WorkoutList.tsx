"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { 
  SearchIcon, 
  MoreVerticalIcon, 
  DumbbellIcon, 
  CalendarIcon, 
  ClockIcon,
  EditIcon,
  Trash2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  EyeIcon,
  FilterIcon,
  ListFilterIcon
} from "lucide-react";
import { getUserWorkouts, deleteWorkout } from "@/lib/workout";
import { Workout, WorkoutType } from "@/types/workout";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { capitalize } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WorkoutListProps {
  onRefresh: () => void;
}

export default function WorkoutList({ onRefresh }: WorkoutListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "name">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadWorkouts = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const workoutsData = await getUserWorkouts(user.id, {
        search: searchTerm || undefined,
        workoutType: workoutTypeFilter !== "all" ? (workoutTypeFilter as WorkoutType) : undefined,
      });
      setWorkouts(workoutsData);
    } catch (error) {
      console.error("Error loading workouts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los entrenamientos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [user?.id, searchTerm, workoutTypeFilter]);

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      toast({
        title: "Entrenamiento eliminado",
        description: "El entrenamiento se ha eliminado correctamente",
      });
      loadWorkouts();
      onRefresh();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el entrenamiento",
        variant: "destructive",
      });
    }
  };

  const handleEditWorkout = (workoutId: string) => {
    router.push(`/dashboard/workout/${workoutId}?edit=true`);
  };

  const handleViewWorkout = (workoutId: string) => {
    router.push(`/dashboard/workout/${workoutId}`);
  };

  const handleSort = (field: "date" | "name") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedWorkouts = () => {
    return [...workouts].sort((a, b) => {
      const aValue = sortField === "date" ? new Date(a.date).getTime() : a.name;
      const bValue = sortField === "date" ? new Date(b.date).getTime() : b.name;

      if (sortField === "date") {
        return sortDirection === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      } else {
        return sortDirection === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
    });
  };

  const renderSortIcon = (field: "date" | "name") => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1" />
    );
  };

  const renderWorkoutTypeLabel = (type: string | null) => {
    if (!type) return "Desconocido";
    
    switch (type) {
      case WorkoutType.STRENGTH:
        return "Fuerza";
      case WorkoutType.CARDIO:
        return "Cardio";
      case WorkoutType.HIIT:
        return "HIIT";
      case WorkoutType.FLEXIBILITY:
        return "Flexibilidad";
      case WorkoutType.CUSTOM:
        return "Personalizado";
      default:
        return capitalize(type);
    }
  };

  const getWorkoutTypeBadgeColor = (type: string | null) => {
    if (!type) return "bg-gray-200 text-gray-800";
    
    switch (type) {
      case WorkoutType.STRENGTH:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case WorkoutType.CARDIO:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case WorkoutType.HIIT:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case WorkoutType.FLEXIBILITY:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case WorkoutType.CUSTOM:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-[240px]" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-[80px] rounded-full" />
              <Skeleton className="h-5 w-[120px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Si no hay entrenamientos
  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-background">
        <DumbbellIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay entrenamientos registrados</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Comienza a registrar tus entrenamientos para hacer seguimiento de tu progreso
        </p>
        <Button 
          onClick={() => router.push('/dashboard/workout/tracker')}
          className="mb-3"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Iniciar un entrenamiento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar entrenamientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={workoutTypeFilter}
            onValueChange={setWorkoutTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por tipo" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value={WorkoutType.STRENGTH}>Fuerza</SelectItem>
              <SelectItem value={WorkoutType.CARDIO}>Cardio</SelectItem>
              <SelectItem value={WorkoutType.HIIT}>HIIT</SelectItem>
              <SelectItem value={WorkoutType.FLEXIBILITY}>Flexibilidad</SelectItem>
              <SelectItem value={WorkoutType.CUSTOM}>Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {getSortedWorkouts().map((workout) => (
          <div 
            key={workout.id}
            onClick={() => handleViewWorkout(workout.id)}
            className="border rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <div className="font-medium text-lg truncate">{workout.name}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getWorkoutTypeBadgeColor(workout.workout_type)}`}>
                  {renderWorkoutTypeLabel(workout.workout_type)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewWorkout(workout.id);
                    }}>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkout(workout.id);
                    }}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(workout.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                {format(new Date(workout.date), "d 'de' MMMM, yyyy", { locale: es })}
              </div>
              {workout.duration_minutes && (
                <div className="flex items-center">
                  <ClockIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {workout.duration_minutes} min
                </div>
              )}
              {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                <div className="flex items-center">
                  <DumbbellIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {workout.muscle_groups.length} grupos musculares
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el
              entrenamiento y todo su historial asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteWorkout(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
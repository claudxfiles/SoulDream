import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  DumbbellIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
} from "@/lib/workout";
import {
  WorkoutTemplate,
  WorkoutType,
  MuscleGroup,
} from "@/types/workout";
import CreateWorkoutTemplateDialog from "./CreateWorkoutTemplateDialog";

export default function WorkoutTemplateManager() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const templatesData = await getWorkoutTemplates(user.id);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error loading workout templates:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas de entrenamiento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setShowCreateDialog(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta plantilla?")) {
      return;
    }

    try {
      await deleteWorkoutTemplate(templateId);
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente",
      });
      loadTemplates();
    } catch (error) {
      console.error("Error deleting workout template:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    loadTemplates();
    setShowCreateDialog(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Plantillas</CardTitle>
          <CardDescription>
            Crea y gestiona plantillas de entrenamiento predefinidas para tus usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setShowCreateDialog(true);
              }}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>

          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <DumbbellIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                No hay plantillas de entrenamiento creadas
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Grupos Musculares</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.workout_type}</TableCell>
                    <TableCell>
                      {template.muscle_groups?.join(", ") || "-"}
                    </TableCell>
                    <TableCell>{template.estimated_duration} min</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil2Icon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(template.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateWorkoutTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
        editingTemplate={editingTemplate}
      />
    </div>
  );
} 
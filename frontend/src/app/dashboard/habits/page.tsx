'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Calendar, Check, CheckCheck, RefreshCw, Bug, Trash2 } from 'lucide-react';
import { CreateHabitDialog } from '@/components/habits/CreateHabitDialog';
import { HabitsList } from '@/components/habits/HabitsList';
import { useHabits } from '@/hooks/useHabits';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { HabitCreate } from '@/types/habit';
import { habitService } from '@/services/habitService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Componente interno que utiliza useHabits
function HabitsPageContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { habits, isLoading, error, refetch, createHabit, completeHabit, deleteHabit } = useHabits();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Función para forzar una recarga manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualizado",
        description: "La lista de hábitos ha sido actualizada",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error al actualizar hábitos:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la lista de hábitos",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para ejecutar diagnóstico
  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const data = await habitService.getDiagnostic();
      setDiagnosticData(data);
      
      toast({
        title: "Diagnóstico completado",
        description: `Se encontraron ${data.habits_with_service_role} hábitos con el rol de servicio y ${data.habits_with_normal_client} con el cliente normal.`,
        duration: 5000,
      });
      
      console.log("Datos de diagnóstico:", data);
    } catch (error) {
      console.error("Error al ejecutar diagnóstico:", error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo completar el diagnóstico",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Manejador para cuando se crea un nuevo hábito
  const handleCreateHabit = (habit: HabitCreate) => {
    if (createHabit && typeof createHabit === 'function') {
      createHabit(habit);
      setIsCreateDialogOpen(false);
      
      // Mostrar toast de éxito
      toast({
        title: "Hábito creado",
        description: "El hábito se ha creado correctamente",
        duration: 3000,
      });
    } else {
      console.error("createHabit no es una función válida", createHabit);
      toast({
        title: "Error al crear hábito",
        description: "Hubo un problema con la creación del hábito. Por favor, intenta nuevamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  // Verificar datos al montar el componente - realizamos solo un único refresh inicial
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Manejador para eliminar un hábito
  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      try {
        deleteHabit(habitToDelete);
        toast({
          title: "Hábito eliminado",
          description: "El hábito se ha eliminado correctamente",
          duration: 3000,
        });
        setHabitToDelete(null);
      } catch (error) {
        console.error("Error al eliminar hábito:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el hábito. Inténtalo nuevamente.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Hábitos" 
        description="Registra y monitoriza tus hábitos diarios para desarrollar consistencia."
        icon={<CheckCircle2 className="h-6 w-6" />}
      />

      <div className="mt-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Actualizando..." : "Actualizar"}</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRunDiagnostic}
            disabled={isRunningDiagnostic}
            className="flex items-center gap-1"
          >
            <Bug className={cn("h-4 w-4", isRunningDiagnostic && "animate-spin")} />
            <span>{isRunningDiagnostic ? "Diagnosticando..." : "Diagnosticar"}</span>
          </Button>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Hábito</span>
        </Button>
      </div>

      {/* Mostrar resultados del diagnóstico si están disponibles */}
      {diagnosticData && (
        <div className="mt-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
          <h3 className="font-medium">Resultados del diagnóstico:</h3>
          <p>ID de usuario: {diagnosticData.user_id}</p>
          <p>Estado de autenticación: {diagnosticData.auth_status}</p>
          <p>Hábitos encontrados (rol de servicio): {diagnosticData.habits_with_service_role}</p>
          <p>Hábitos encontrados (cliente normal): {diagnosticData.habits_with_normal_client}</p>
          {diagnosticData.error && <p className="text-red-500">Error: {diagnosticData.error}</p>}
        </div>
      )}

      <div className="mt-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Pendientes</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
            <TabsTrigger value="calendar">Calendario</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </div>
              ))
            ) : habits?.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-lg border bg-card">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No hay hábitos</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comienza creando tu primer hábito para seguir tu progreso.
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Crear primer hábito
                </Button>
              </div>
            ) : (
              <HabitsList 
                habits={habits} 
                isLoading={isLoading} 
                error={error} 
                onComplete={({ habitId }) => completeHabit({ habitId })}
                onDelete={handleDeleteHabit}
              />
            )}
          </TabsContent>
          
          <TabsContent value="active">
            <div className="grid gap-4">
              {!isLoading && habits?.filter(h => !h.isCompletedToday).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCheck className="h-10 w-10 mx-auto text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">¡Todos completados!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Has completado todos tus hábitos de hoy. ¡Excelente trabajo!
                  </p>
                </div>
              ) : (
                habits?.filter(h => !h.isCompletedToday).map((habit) => (
                  <div key={habit.id} className="p-4 rounded-lg border bg-card flex justify-between items-center hover:border-primary/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{habit.title}</h3>
                      {habit.description && (
                        <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => completeHabit({ habitId: habit.id })}
                      size="sm"
                      variant="outline"
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/50 dark:hover:text-green-400 dark:hover:border-green-800"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Completar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="grid gap-4">
              {!isLoading && habits?.filter(h => h.isCompletedToday).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Sin hábitos completados hoy</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completa tus hábitos para verlos aquí.
                  </p>
                </div>
              ) : (
                habits?.filter(h => h.isCompletedToday).map((habit) => (
                  <div key={habit.id} className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{habit.title}</h3>
                      {habit.description && (
                        <p className="text-sm text-muted-foreground mt-1">{habit.description}</p>
                      )}
                      
                      {habit.current_streak > 0 && (
                        <p className="text-xs mt-2 text-amber-600 dark:text-amber-400">
                          🔥 {habit.current_streak} días consecutivos
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCheck className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Completado</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Próximamente</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Vista de calendario para seguimiento de hábitos.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateHabitDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateHabit={handleCreateHabit}
      />
      
      <AlertDialog open={!!habitToDelete} onOpenChange={() => habitToDelete ? setHabitToDelete(null) : null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar hábito</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este hábito y todos sus registros?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteHabit}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Crear un cliente de consulta específico para esta página
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente principal que envuelve el contenido con el proveedor
export default function HabitsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HabitsPageContent />
    </QueryClientProvider>
  );
} 
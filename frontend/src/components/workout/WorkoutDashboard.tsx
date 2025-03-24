"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarIcon, 
  BarChart3Icon, 
  DumbbellIcon, 
  TimerIcon, 
  PlusIcon, 
  SparklesIcon, 
  PlusCircleIcon, 
  BookmarkIcon, 
  LayoutTemplateIcon, 
  ListIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  BrainIcon,
  Dumbbell,
  TargetIcon,
  UsersIcon,
  ClockIcon
} from "lucide-react";
import WorkoutList from "./WorkoutList";
import WorkoutStatisticsView from "./WorkoutStatisticsView";
import WorkoutProgressView from "./WorkoutProgressView";
import WorkoutProgressChart from "./WorkoutProgressChart";
import WorkoutTracker from "./WorkoutTracker";
import WorkoutRecommendationEngine from "./WorkoutRecommendationEngine";
import CreateWorkoutDialog from "./CreateWorkoutDialog";
import WorkoutCalendarIntegration from "./WorkoutCalendarIntegration";
import AIWorkoutRecommendations from "./AIWorkoutRecommendations";
import { useToast } from "@/components/ui/use-toast";
import { getUserWorkouts, getWorkoutStatistics } from "@/lib/workout";
import { WorkoutStatistics } from "@/types/workout";
import { useAuth } from "@/hooks/useAuth";
import WorkoutTemplateSelector from "./WorkoutTemplateSelector";
import Link from "next/link";

export default function WorkoutDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("workouts");
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<WorkoutStatistics | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const statsData = await getWorkoutStatistics(user.id);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading workout statistics:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas de entrenamiento",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user?.id, refreshKey, toast]);

  // Definimos los módulos para tener información centralizada
  const workoutModules = [
    {
      id: "tracker",
      name: "Rastreador",
      description: "Registra tu entrenamiento en tiempo real",
      icon: <TimerIcon className="h-5 w-5" />,
      color: "bg-amber-500",
      url: "/dashboard/workout/tracker",
      action: () => router.push("/dashboard/workout/tracker")
    },
    {
      id: "templates",
      name: "Plantillas",
      description: "Selecciona una rutina predefinida",
      icon: <LayoutTemplateIcon className="h-5 w-5" />,
      color: "bg-emerald-500",
      action: () => setShowTemplateSelector(true)
    },
    {
      id: "create",
      name: "Nuevo",
      description: "Crea un entrenamiento desde cero",
      icon: <PlusCircleIcon className="h-5 w-5" />,
      color: "bg-indigo-500",
      action: () => setShowCreateDialog(true)
    },
    {
      id: "ai",
      name: "Recomendaciones AI",
      description: "Obtén rutinas personalizadas con IA",
      icon: <SparklesIcon className="h-5 w-5" />,
      color: "bg-purple-500",
      url: "#ai-recommendations",
      action: () => document.getElementById("ai-recommendations")?.scrollIntoView({ behavior: "smooth" })
    }
  ];

  return (
    <div className="space-y-8">
      {/* Barra de navegación principal del módulo */}
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="main" className="flex items-center gap-2">
            <DumbbellIcon className="h-4 w-4" />
            Principal
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <ListIcon className="h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Progreso
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <TargetIcon className="h-4 w-4" />
            Planes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          {/* Módulos principales con tarjetas interactivas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workoutModules.map((module) => (
              <Card 
                key={module.id} 
                className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                onClick={module.action}
              >
                <div className={`h-1.5 w-full ${module.color}`}></div>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-full p-2 ${module.color} bg-opacity-20`}>
                      {module.icon}
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-muted-foreground mt-2" />
                  </div>
                  <h3 className="font-medium mt-3 text-lg">{module.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progreso reciente y estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ListIcon className="h-5 w-5 text-primary" />
                  Entrenamientos Recientes
                </CardTitle>
                <CardDescription>
                  Historial de tus últimas sesiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutList onRefresh={handleRefresh} key={`list-${refreshKey}`} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3Icon className="h-5 w-5 text-primary" />
                  Estadísticas
                </CardTitle>
                <CardDescription>
                  Resumen de tu actividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutStatisticsView stats={stats} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>

          {/* Recomendaciones IA */}
          <Card id="ai-recommendations">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <BrainIcon className="h-5 w-5 text-purple-500" />
                Recomendaciones Inteligentes
              </CardTitle>
              <CardDescription>
                Rutinas personalizadas basadas en tus objetivos y progreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIWorkoutRecommendations onCreateWorkout={setShowCreateDialog} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ListIcon className="h-5 w-5 text-primary" />
                Historial de Entrenamientos
              </CardTitle>
              <CardDescription>
                Visualiza y gestiona todos tus entrenamientos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutList onRefresh={handleRefresh} key={`list-full-${refreshKey}`} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Calendario de Actividad
              </CardTitle>
              <CardDescription>
                Visualiza tus entrenamientos en formato calendario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutCalendarIntegration />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-primary" />
                  Progreso Personal
                </CardTitle>
                <CardDescription>
                  Evolución de tus métricas y objetivos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutProgressView />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3Icon className="h-5 w-5 text-primary" />
                  Análisis Detallado
                </CardTitle>
                <CardDescription>
                  Estadísticas avanzadas de rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutProgressChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-primary" />
                  Planes Recomendados
                </CardTitle>
                <CardDescription>
                  Rutinas creadas por entrenadores profesionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutRecommendationEngine />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <LayoutTemplateIcon className="h-5 w-5 text-primary" />
                  Plantillas Personalizadas
                </CardTitle>
                <CardDescription>
                  Crea y gestiona tus propias rutinas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <LayoutTemplateIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Crea tus plantillas personalizadas</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Diseña rutinas que puedas reutilizar fácilmente para optimizar tus entrenamientos
                  </p>
                  <Button 
                    onClick={() => setShowTemplateSelector(true)}
                    className="mb-3"
                  >
                    <LayoutTemplateIcon className="h-4 w-4 mr-2" />
                    Gestionar Plantillas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogos para crear entrenamientos */}
      <CreateWorkoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleRefresh}
      />
      
      <WorkoutTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSuccess={handleRefresh}
      />
    </div>
  );
} 
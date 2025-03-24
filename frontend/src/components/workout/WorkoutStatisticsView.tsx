"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutStatistics } from "@/types/workout";
import {
  DumbbellIcon,
  ClockIcon,
  CalendarIcon,
  BarChart3Icon,
  TrendingUpIcon,
  FlameIcon,
  ActivityIcon
} from "lucide-react";

interface WorkoutStatisticsViewProps {
  stats: WorkoutStatistics | null;
  isLoading: boolean;
}

export default function WorkoutStatisticsView({ stats, isLoading }: WorkoutStatisticsViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No hay estadísticas disponibles</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Preparar datos para gráficos de barra (simulado sin el gráfico real)
  const getTopTypes = () => {
    return Object.entries(stats.workoutsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count
      }));
  };

  const getTopMonths = () => {
    return Object.entries(stats.workoutsByMonth)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([month, count]) => ({
        month,
        count
      }));
  };

  const topTypes = getTopTypes();
  const topMonths = getTopMonths();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entrenamientos
            </CardTitle>
            <DumbbellIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              Sesiones registradas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Tiempo Total
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Minutos de entrenamiento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ejercicios Realizados
            </CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExercises}</div>
            <p className="text-xs text-muted-foreground">
              Total de ejercicios
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Racha Actual
            </CardTitle>
            <FlameIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streakDays}</div>
            <p className="text-xs text-muted-foreground">
              Días consecutivos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
            <CardDescription>
              Tipos de entrenamiento más frecuentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(stats.workoutsByType).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay datos suficientes
                </p>
              ) : (
                topTypes.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} sesiones
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${(item.count / stats.totalWorkouts) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Mensual</CardTitle>
            <CardDescription>
              Meses con mayor actividad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(stats.workoutsByMonth).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay datos suficientes
                </p>
              ) : (
                topMonths.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} sesiones
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${(item.count / Math.max(...Object.values(stats.workoutsByMonth))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>
            Información general de tus entrenamientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DumbbellIcon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">Tipo Favorito</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.favoriteWorkoutType !== "N/A" 
                      ? stats.favoriteWorkoutType.charAt(0).toUpperCase() + stats.favoriteWorkoutType.slice(1) 
                      : "Sin datos suficientes"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">Duración Promedio</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.averageDuration ? `${Math.round(stats.averageDuration)} minutos por sesión` : "Sin datos"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">Frecuencia</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalWorkouts > 0 
                      ? `Aproximadamente ${Math.round(stats.totalWorkouts / (Object.keys(stats.workoutsByMonth).length || 1))} entrenamientos por mes` 
                      : "Sin datos suficientes"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">Progreso</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalWorkouts > 0 
                      ? "Mantén la constancia para mejores resultados" 
                      : "Comienza a registrar tus entrenamientos"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
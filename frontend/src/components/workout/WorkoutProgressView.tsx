"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getExerciseProgressData, getRecentExercises } from "@/lib/workout";
import { WorkoutProgressData } from "@/types/workout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DumbbellIcon, TrendingUpIcon, WeightIcon, ActivityIcon, TimerIcon, MoveIcon } from "lucide-react";

export default function WorkoutProgressView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<"weight" | "reps" | "duration" | "distance">("weight");
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const [progressData, setProgressData] = useState<WorkoutProgressData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasExercises, setHasExercises] = useState<boolean>(true);

  // Cargar ejercicios recientes
  useEffect(() => {
    const loadRecentExercises = async () => {
      if (!user?.id) return;
      try {
        const exercises = await getRecentExercises(user.id);
        setRecentExercises(exercises);
        setHasExercises(exercises.length > 0);
        
        if (exercises.length > 0 && !selectedExercise) {
          setSelectedExercise(exercises[0]);
        }
      } catch (error) {
        console.error("Error loading recent exercises:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los ejercicios recientes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentExercises();
  }, [user?.id, toast]);

  // Cargar datos de progreso cuando cambie el ejercicio o la métrica
  useEffect(() => {
    const loadProgressData = async () => {
      if (!user?.id || !selectedExercise) return;
      
      setIsLoading(true);
      try {
        const data = await getExerciseProgressData(
          user.id,
          selectedExercise,
          selectedMetric
        );
        setProgressData(data);
      } catch (error) {
        console.error("Error loading progress data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de progreso",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [user?.id, selectedExercise, selectedMetric, toast]);

  const formatChartData = () => {
    if (!progressData || progressData.dates.length === 0) return [];
    
    return progressData.dates.map((date, index) => ({
      date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      value: progressData.values[index],
    }));
  };

  const getMetricUnit = () => {
    switch (selectedMetric) {
      case "weight":
        return "kg";
      case "reps":
        return "reps";
      case "duration":
        return "seg";
      case "distance":
        return "m";
      default:
        return "";
    }
  };

  const getMetricName = () => {
    switch (selectedMetric) {
      case "weight":
        return "Peso";
      case "reps":
        return "Repeticiones";
      case "duration":
        return "Duración";
      case "distance":
        return "Distancia";
      default:
        return "";
    }
  };

  const getMetricIcon = () => {
    switch (selectedMetric) {
      case "weight":
        return <WeightIcon className="h-4 w-4" />;
      case "reps":
        return <ActivityIcon className="h-4 w-4" />;
      case "duration":
        return <TimerIcon className="h-4 w-4" />;
      case "distance":
        return <MoveIcon className="h-4 w-4" />;
      default:
        return <TrendingUpIcon className="h-4 w-4" />;
    }
  };

  const chartData = formatChartData();
  const maxValue = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.value)) 
    : 0;
  const minValue = chartData.length > 0 
    ? Math.min(...chartData.map(d => d.value)) 
    : 0;
  
  // Añadir un 10% de espacio adicional arriba y abajo
  const yAxisDomain = [
    Math.max(0, minValue - (maxValue - minValue) * 0.1),
    maxValue + (maxValue - minValue) * 0.1
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguimiento de Progreso</CardTitle>
        <CardDescription>
          Visualiza tu progreso en diferentes ejercicios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasExercises ? (
          <div className="text-center py-12 border rounded-lg">
            <DumbbellIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay datos de ejercicios</h3>
            <p className="text-muted-foreground mt-2">
              Registra tus entrenamientos para comenzar a visualizar tu progreso
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Ejercicio</label>
                <Select
                  value={selectedExercise}
                  onValueChange={setSelectedExercise}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ejercicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentExercises.map((exercise) => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-[200px]">
                <label className="text-sm font-medium mb-2 block">Métrica</label>
                <Tabs
                  value={selectedMetric}
                  onValueChange={(v) => setSelectedMetric(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="weight" title="Peso">
                      <WeightIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="reps" title="Repeticiones">
                      <ActivityIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="duration" title="Duración">
                      <TimerIcon className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="distance" title="Distancia">
                      <MoveIcon className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : !progressData || progressData.values.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <TrendingUpIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No hay datos de progreso</h3>
                <p className="text-muted-foreground mt-2">
                  No se encontraron registros para este ejercicio con la métrica seleccionada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{progressData.exerciseName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {getMetricIcon()}
                      <span>{getMetricName()}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {progressData.values[progressData.values.length - 1]}
                      <span className="text-sm ml-1 text-muted-foreground">
                        {getMetricUnit()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Último registro
                    </p>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={yAxisDomain}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.toString()}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} ${getMetricUnit()}`, getMetricName()]}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Mejor: </span>
                    {Math.max(...progressData.values)} {getMetricUnit()}
                  </div>
                  <div>
                    <span className="font-medium">Promedio: </span>
                    {(progressData.values.reduce((a, b) => a + b, 0) / progressData.values.length).toFixed(1)} {getMetricUnit()}
                  </div>
                  <div>
                    <span className="font-medium">Progreso: </span>
                    {progressData.values.length > 1 
                      ? (((progressData.values[progressData.values.length - 1] - progressData.values[0]) / progressData.values[0]) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
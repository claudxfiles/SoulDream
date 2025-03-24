"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getExerciseProgressData, getRecentExercises, getWorkoutStatistics } from "@/lib/workout";
import { WorkoutProgressData, MuscleGroup } from "@/types/workout";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { 
  TrendingUpIcon, 
  DumbbellIcon, 
  BarChart3Icon, 
  ActivityIcon, 
  LineChartIcon, 
  AreaChartIcon,
  RadarIcon,
  TimerIcon,
  CalendarIcon
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface MuscleGroupProgress {
  muscleGroup: string;
  workouts: number;
  sets: number;
  volume: number;
}

interface MonthlyProgress {
  month: string;
  workouts: number;
  duration: number;
  volume: number;
}

interface ChartOptions {
  chart: 'line' | 'area' | 'bar' | 'radar';
  timeframe: '1m' | '3m' | '6m' | 'all';
}

export default function WorkoutProgressChart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<"weight" | "reps" | "duration" | "distance">("weight");
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const [progressData, setProgressData] = useState<WorkoutProgressData | null>(null);
  const [muscleGroupData, setMuscleGroupData] = useState<MuscleGroupProgress[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    chart: 'line',
    timeframe: '3m'
  });

  // Cargar ejercicios recientes
  useEffect(() => {
    const loadRecentExercises = async () => {
      if (!user?.id) return;
      try {
        const exercises = await getRecentExercises(user.id);
        setRecentExercises(exercises);
        
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
      }
    };

    loadRecentExercises();
  }, [user?.id, toast, selectedExercise]);

  // Cargar datos de estadísticas generales
  useEffect(() => {
    const loadStatisticsData = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      
      try {
        const stats = await getWorkoutStatistics(user.id);
        
        // Preparar datos por grupo muscular
        const muscleData: MuscleGroupProgress[] = Object.entries(stats.mostWorkedMuscleGroups)
          .map(([muscleGroup, count]) => ({
            muscleGroup: muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1),
            workouts: count,
            sets: Math.round(count * 3.5), // valores estimados para demostración
            volume: Math.round(count * 120) // valores estimados para demostración
          }))
          .sort((a, b) => b.workouts - a.workouts)
          .slice(0, 8); // Tomar los 8 grupos musculares más trabajados
        
        setMuscleGroupData(muscleData);
        
        // Preparar datos mensuales
        const months = Object.entries(stats.workoutsByMonth)
          .map(([month, count]) => {
            // Simular datos de duración y volumen para demostración
            const duration = count * (20 + Math.floor(Math.random() * 30)); // entre 20-50 min por entrenamiento
            const volume = count * (500 + Math.floor(Math.random() * 1000)); // entre 500-1500 kg por entrenamiento
            
            return {
              month,
              workouts: count,
              duration,
              volume
            };
          })
          .sort((a, b) => {
            const monthA = new Date(a.month).getTime();
            const monthB = new Date(b.month).getTime();
            return monthA - monthB;
          });
        
        setMonthlyData(months);
      } catch (error) {
        console.error("Error loading statistics data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de estadísticas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStatisticsData();
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
    
    // Filtrar por marco de tiempo
    const now = new Date();
    let cutoffDate: Date;
    
    switch (chartOptions.timeframe) {
      case '1m':
        cutoffDate = subMonths(now, 1);
        break;
      case '3m':
        cutoffDate = subMonths(now, 3);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      default:
        cutoffDate = new Date(0); // Sin filtro para 'all'
    }
    
    const cutoffTime = cutoffDate.getTime();
    
    return progressData.dates
      .map((date, index) => ({
        date: parseISO(date),
        formattedDate: format(parseISO(date), 'dd MMM', { locale: es }),
        value: progressData.values[index],
      }))
      .filter(item => item.date.getTime() >= cutoffTime)
      .map(item => ({
        ...item,
        date: item.formattedDate
      }));
  };

  const formatMonthlyData = () => {
    // Filtrar por marco de tiempo
    const now = new Date();
    let cutoffDate: Date;
    
    switch (chartOptions.timeframe) {
      case '1m':
        cutoffDate = subMonths(now, 1);
        break;
      case '3m':
        cutoffDate = subMonths(now, 3);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      default:
        cutoffDate = new Date(0); // Sin filtro para 'all'
    }
    
    const cutoffTime = cutoffDate.getTime();
    
    return monthlyData
      .filter(item => new Date(item.month).getTime() >= cutoffTime)
      .map(item => ({
        ...item,
        month: format(new Date(item.month), 'MMM yy', { locale: es })
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

  const renderExerciseProgressChart = () => {
    const chartData = formatChartData();
    
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] border rounded-lg">
          <TrendingUpIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground">No hay datos de progreso para mostrar</p>
        </div>
      );
    }
    
    switch (chartOptions.chart) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis unit={` ${getMetricUnit()}`} />
              <Tooltip 
                formatter={(value) => [`${value} ${getMetricUnit()}`, "Valor"]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4f46e5" 
                fill="#4f46e580" 
                name={`${selectedMetric}`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis unit={` ${getMetricUnit()}`} />
              <Tooltip 
                formatter={(value) => [`${value} ${getMetricUnit()}`, "Valor"]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Bar 
                dataKey="value" 
                fill="#4f46e5" 
                name={`${selectedMetric}`} 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default: // line chart
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis unit={` ${getMetricUnit()}`} />
              <Tooltip 
                formatter={(value) => [`${value} ${getMetricUnit()}`, "Valor"]}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#4f46e5" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={`${selectedMetric}`} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderMuscleGroupChart = () => {
    if (muscleGroupData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] border rounded-lg">
          <DumbbellIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground">No hay datos de grupos musculares para mostrar</p>
        </div>
      );
    }
    
    switch (chartOptions.chart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={muscleGroupData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="muscleGroup" 
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="workouts" fill="#4f46e5" name="Entrenamientos" />
              <Bar dataKey="sets" fill="#10b981" name="Series" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart 
              outerRadius={150} 
              data={muscleGroupData}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="muscleGroup" />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
              <Radar 
                name="Entrenamientos" 
                dataKey="workouts" 
                stroke="#4f46e5" 
                fill="#4f46e580" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="Series" 
                dataKey="sets" 
                stroke="#10b981" 
                fill="#10b98180" 
                fillOpacity={0.6} 
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      default: // line chart
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={muscleGroupData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="muscleGroup" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="workouts" 
                stroke="#4f46e5" 
                strokeWidth={2}
                name="Entrenamientos" 
              />
              <Line 
                type="monotone" 
                dataKey="sets" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Series" 
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Volumen (kg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderMonthlyProgressChart = () => {
    const chartData = formatMonthlyData();
    
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] border rounded-lg">
          <CalendarIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground">No hay datos mensuales para mostrar</p>
        </div>
      );
    }
    
    switch (chartOptions.chart) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="workouts" 
                stroke="#4f46e5" 
                fill="#4f46e580" 
                name="Entrenamientos" 
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="duration" 
                stroke="#10b981" 
                fill="#10b98180" 
                name="Duración (min)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="workouts" fill="#4f46e5" name="Entrenamientos" />
              <Bar dataKey="duration" fill="#10b981" name="Duración (min)" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default: // line chart
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="workouts" 
                stroke="#4f46e5" 
                strokeWidth={2}
                name="Entrenamientos" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="duration" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Duración (min)" 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="volume" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Volumen (kg)" 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análisis de Progreso</CardTitle>
        <CardDescription>
          Visualiza tu progreso en ejercicios, grupos musculares y tendencias mensuales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles de configuración del gráfico */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de gráfico</label>
            <div className="flex space-x-1">
              <Button
                variant={chartOptions.chart === 'line' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartOptions({...chartOptions, chart: 'line'})}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartOptions.chart === 'area' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartOptions({...chartOptions, chart: 'area'})}
              >
                <AreaChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartOptions.chart === 'bar' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartOptions({...chartOptions, chart: 'bar'})}
              >
                <BarChart3Icon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartOptions.chart === 'radar' ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setChartOptions({...chartOptions, chart: 'radar'})}
              >
                <RadarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <div className="flex space-x-1">
              <Button
                variant={chartOptions.timeframe === '1m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartOptions({...chartOptions, timeframe: '1m'})}
              >
                1M
              </Button>
              <Button
                variant={chartOptions.timeframe === '3m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartOptions({...chartOptions, timeframe: '3m'})}
              >
                3M
              </Button>
              <Button
                variant={chartOptions.timeframe === '6m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartOptions({...chartOptions, timeframe: '6m'})}
              >
                6M
              </Button>
              <Button
                variant={chartOptions.timeframe === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartOptions({...chartOptions, timeframe: 'all'})}
              >
                Todo
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs para diferentes tipos de gráficos */}
        <Tabs defaultValue="exercise">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="exercise">Ejercicios</TabsTrigger>
            <TabsTrigger value="muscleGroups">Grupos Musculares</TabsTrigger>
            <TabsTrigger value="monthly">Progreso Mensual</TabsTrigger>
          </TabsList>
          
          {/* Tab de progreso de ejercicios */}
          <TabsContent value="exercise">
            <div className="space-y-4">
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
                        <DumbbellIcon className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="reps" title="Repeticiones">
                        <ActivityIcon className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="duration" title="Duración">
                        <TimerIcon className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="distance" title="Distancia">
                        <TrendingUpIcon className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="mt-4">
                  {renderExerciseProgressChart()}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de grupos musculares */}
          <TabsContent value="muscleGroups">
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
                  {renderMuscleGroupChart()}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de progreso mensual */}
          <TabsContent value="monthly">
            <div className="space-y-4">
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div>
                  {renderMonthlyProgressChart()}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 
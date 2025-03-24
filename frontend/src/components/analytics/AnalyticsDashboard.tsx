"use client";

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCompletionChart } from './TaskCompletionChart';
import { FinancialChart } from './FinancialChart';
import { HabitStreakCalendar } from './HabitStreakCalendar';
import { InsightCard } from './InsightCard';
import { AnalyticsCard } from './AnalyticsCard';
import { analyticsService } from '@/services/analytics';
import { 
  AnalyticsMetric, 
  AIInsight, 
  AnalyticsPeriod,
  TaskCompletionData,
  FinancialData,
  HabitStreakData
} from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCcw, Loader2 } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para almacenar las métricas
  const [taskMetrics, setTaskMetrics] = useState<TaskCompletionData[]>([]);
  const [habitMetrics, setHabitMetrics] = useState<HabitStreakData[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialData[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Calcular fechas de inicio y fin según el período
  const getDateRange = () => {
    let startDate, endDate;
    
    switch (period) {
      case 'daily':
        startDate = startOfWeek(currentDate, { locale: es });
        endDate = endOfWeek(currentDate, { locale: es });
        break;
      case 'weekly':
        startDate = startOfMonth(subMonths(currentDate, 1));
        endDate = endOfMonth(currentDate);
        break;
      case 'monthly':
        startDate = startOfMonth(subMonths(currentDate, 5));
        endDate = endOfMonth(currentDate);
        break;
      case 'yearly':
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      default:
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
    }
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };

  // Cambiar el período de tiempo
  const handlePeriodChange = (value: string) => {
    setPeriod(value as AnalyticsPeriod);
  };

  // Navegar en el tiempo
  const navigateDate = (direction: 'prev' | 'next') => {
    const amount = period === 'yearly' ? 1 : period === 'monthly' ? 1 : 1;
    
    if (direction === 'prev') {
      setCurrentDate(prevDate => 
        period === 'yearly' 
          ? new Date(prevDate.getFullYear() - 1, prevDate.getMonth(), 1)
          : subMonths(prevDate, amount)
      );
    } else {
      setCurrentDate(prevDate => 
        period === 'yearly' 
          ? new Date(prevDate.getFullYear() + 1, prevDate.getMonth(), 1)
          : addMonths(prevDate, amount)
      );
    }
  };

  // Formatear el título del rango de fechas
  const getDateRangeTitle = () => {
    if (period === 'yearly') {
      return `${currentDate.getFullYear()}`;
    } else if (period === 'monthly') {
      return `${format(currentDate, 'MMMM yyyy', { locale: es })}`;
    } else if (period === 'weekly') {
      const start = startOfWeek(currentDate, { locale: es });
      const end = endOfWeek(currentDate, { locale: es });
      return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
    } else {
      return `${format(currentDate, 'd MMMM yyyy', { locale: es })}`;
    }
  };

  // Cargar datos del período seleccionado
  const loadData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    
    try {
      // Cargar métricas para tareas
      const taskData = await analyticsService.getMetrics('tasks_completed', period, startDate, endDate);
      if (taskData.length > 0) {
        setTaskMetrics(taskData[0].data as unknown as TaskCompletionData[]);
      } else {
        // Si no hay datos, generar métricas
        const generatedTaskMetrics = await analyticsService.generateTaskMetrics(startDate, endDate, period);
        setTaskMetrics(generatedTaskMetrics.data as unknown as TaskCompletionData[]);
      }
      
      // Cargar métricas para hábitos
      const habitData = await analyticsService.getMetrics('habits_streaks', period, startDate, endDate);
      if (habitData.length > 0) {
        setHabitMetrics(habitData[0].data as unknown as HabitStreakData[]);
      } else {
        // Si no hay datos, generar métricas
        const generatedHabitMetrics = await analyticsService.generateHabitMetrics(startDate, endDate, period);
        setHabitMetrics(generatedHabitMetrics.data as unknown as HabitStreakData[]);
      }
      
      // Cargar métricas financieras
      const financialData = await analyticsService.getMetrics('financial_spending', period, startDate, endDate);
      if (financialData.length > 0) {
        setFinancialMetrics(financialData[0].data as unknown as FinancialData[]);
      } else {
        // Si no hay datos, generar métricas
        const generatedFinancialMetrics = await analyticsService.generateFinancialMetrics(startDate, endDate, period);
        setFinancialMetrics(generatedFinancialMetrics.data as unknown as FinancialData[]);
      }
      
      // Cargar insights
      const insightsData = await analyticsService.getInsights();
      setInsights(insightsData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Regenerar métricas e insights
  const refreshMetrics = async () => {
    setRefreshing(true);
    const { startDate, endDate } = getDateRange();
    
    try {
      // Generar todas las métricas
      const taskMetrics = await analyticsService.generateTaskMetrics(startDate, endDate, period);
      setTaskMetrics(taskMetrics.data as unknown as TaskCompletionData[]);
      
      const habitMetrics = await analyticsService.generateHabitMetrics(startDate, endDate, period);
      setHabitMetrics(habitMetrics.data as unknown as HabitStreakData[]);
      
      const financialMetrics = await analyticsService.generateFinancialMetrics(startDate, endDate, period);
      setFinancialMetrics(financialMetrics.data as unknown as FinancialData[]);
      
      // Generar insights basados en las nuevas métricas
      const newInsights = await analyticsService.generateInsights();
      setInsights(prevInsights => [...newInsights, ...prevInsights]);
      
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Cargar datos al montar el componente y cuando cambia el período o la fecha
  useEffect(() => {
    loadData();
  }, [period, currentDate]);

  // Datos de ejemplo para el dashboard
  const mockTaskData: TaskCompletionData[] = [
    { date: '2023-10-01', count: 5, priority: 'high' },
    { date: '2023-10-02', count: 3, priority: 'medium' },
    { date: '2023-10-03', count: 7, priority: 'low' },
    { date: '2023-10-04', count: 2, priority: 'high' },
    { date: '2023-10-05', count: 4, priority: 'medium' },
  ];

  const mockFinancialData = [
    { date: '2023-10-01', amount: 150, category: 'Alimentación' },
    { date: '2023-10-01', amount: 200, category: 'Transporte' },
    { date: '2023-10-02', amount: 50, category: 'Ocio' },
    { date: '2023-10-03', amount: 300, category: 'Hogar' },
    { date: '2023-10-04', amount: 75, category: 'Salud' },
  ];

  const mockFinancialChartData = [
    { date: '2023-10-01', income: 1000, expense: 350 },
    { date: '2023-10-02', income: 0, expense: 50 },
    { date: '2023-10-03', income: 0, expense: 300 },
    { date: '2023-10-04', income: 500, expense: 75 },
    { date: '2023-10-05', income: 0, expense: 125 },
  ];

  const mockCategoryData = [
    { name: 'Alimentación', value: 28 },
    { name: 'Transporte', value: 20 },
    { name: 'Ocio', value: 15 },
    { name: 'Hogar', value: 25 },
    { name: 'Salud', value: 12 },
  ];

  const mockHabitStreakData: HabitStreakData[] = [
    { date: '2023-10-01', habitId: '1', habitName: 'Ejercicio', streak: 7 },
    { date: '2023-10-02', habitId: '1', habitName: 'Ejercicio', streak: 8 },
    { date: '2023-10-03', habitId: '1', habitName: 'Ejercicio', streak: 9 },
    { date: '2023-10-04', habitId: '1', habitName: 'Ejercicio', streak: 10 },
    { date: '2023-10-05', habitId: '1', habitName: 'Ejercicio', streak: 11 },
  ];

  const mockInsight: AIInsight = {
    id: '1',
    user_id: '1',
    insight_type: 'productivity',
    description: 'Has completado más tareas de alta prioridad esta semana que la semana pasada',
    relevance: 85,
    created_at: new Date().toISOString(),
    data: {
      thisWeek: 12,
      lastWeek: 8,
      improvement: 50
    },
    related_metrics: null
  };

  const mockFinancialInsight: AIInsight = {
    id: '2',
    user_id: '1',
    insight_type: 'financial',
    description: 'Has reducido tus gastos en Ocio un 15% respecto al mes pasado',
    relevance: 75,
    created_at: new Date().toISOString(),
    data: {
      thisMonth: 320,
      lastMonth: 376,
      reduction: 15
    },
    related_metrics: null
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard de Analítica Personal</h1>
        
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              &lt;
            </Button>
            <div className="flex items-center gap-2 min-w-32 justify-center">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">{getDateRangeTitle()}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              &gt;
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshMetrics} 
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Actualizar Datos
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Cargando métricas...</span>
        </div>
      ) : (
        <>
          {/* Sección de insights principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {insights.length > 0 ? (
              insights.slice(0, 2).map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            ) : (
              <>
                <InsightCard insight={mockInsight} />
                <InsightCard insight={mockFinancialInsight} />
              </>
            )}
          </div>

          <Tabs defaultValue="productivity" className="space-y-6">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="productivity">Productividad</TabsTrigger>
              <TabsTrigger value="habits">Hábitos</TabsTrigger>
              <TabsTrigger value="finances">Finanzas</TabsTrigger>
              <TabsTrigger value="insights">Todos los Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="productivity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskCompletionChart 
                  data={taskMetrics.length > 0 ? taskMetrics : mockTaskData} 
                  period={period === 'yearly' ? 'monthly' : period === 'monthly' ? 'daily' : 'daily'}
                />
                <AnalyticsCard title="Distribución de Tareas por Prioridad">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Alta', value: taskMetrics.reduce((acc, item) => acc + (item.priority === 'high' ? item.count : 0), 0) || 12 },
                            { name: 'Media', value: taskMetrics.reduce((acc, item) => acc + (item.priority === 'medium' ? item.count : 0), 0) || 25 },
                            { name: 'Baja', value: taskMetrics.reduce((acc, item) => acc + (item.priority === 'low' ? item.count : 0), 0) || 18 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </AnalyticsCard>
              </div>
            </TabsContent>
            
            <TabsContent value="habits" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <HabitStreakCalendar 
                  data={habitMetrics.length > 0 ? habitMetrics : mockHabitStreakData}
                  title="Calendario de Consistencia de Hábitos"
                  year={currentDate.getFullYear()}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="finances" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FinancialChart 
                  data={financialMetrics.length > 0 ? financialMetrics : mockFinancialChartData}
                  type="line"
                  title="Ingresos vs Gastos"
                  dataKeys={['income', 'expense']}
                />
                <FinancialChart 
                  data={mockCategoryData}
                  type="pie"
                  title="Distribución de Gastos por Categoría"
                  dataKeys={['value', 'name']}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {insights.length > 0 ? (
                  insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))
                ) : (
                  <>
                    <InsightCard insight={mockInsight} />
                    <InsightCard insight={mockFinancialInsight} />
                    <InsightCard insight={{
                      ...mockInsight,
                      id: '3',
                      insight_type: 'habits',
                      description: 'Has mantenido tu hábito de "Meditación" durante 14 días consecutivos',
                      relevance: 90,
                      data: { streak: 14, previousBest: 7 }
                    }} />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 
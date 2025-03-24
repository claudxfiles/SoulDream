import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../types/supabase";
import { 
  AnalyticsMetric, 
  AIInsight, 
  MetricType, 
  AnalyticsPeriod,
  InsightType
} from "@/types/analytics";

const createAnalyticsService = () => {
  const supabase = createClientComponentClient<Database>();

  // Obtener métricas por tipo y período
  const getMetrics = async (
    metricType: MetricType,
    period: AnalyticsPeriod,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsMetric[]> => {
    const { data, error } = await supabase
      .from("analytics")
      .select("*")
      .eq("metric_type", metricType)
      .eq("period", period)
      .gte("start_date", startDate)
      .lte("end_date", endDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching metrics:", error);
      throw error;
    }

    return data as unknown as AnalyticsMetric[];
  };

  // Crear o actualizar métrica
  const upsertMetric = async (metric: Omit<AnalyticsMetric, "id" | "created_at" | "updated_at">): Promise<AnalyticsMetric> => {
    const { data, error } = await supabase
      .from("analytics")
      .upsert(metric)
      .select()
      .single();

    if (error) {
      console.error("Error upserting metric:", error);
      throw error;
    }

    return data as unknown as AnalyticsMetric;
  };

  // Obtener insights por tipo
  const getInsights = async (insightType?: InsightType): Promise<AIInsight[]> => {
    let query = supabase
      .from("ai_insights")
      .select("*")
      .order("relevance", { ascending: false });

    if (insightType) {
      query = query.eq("insight_type", insightType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching insights:", error);
      throw error;
    }

    return data as unknown as AIInsight[];
  };

  // Crear un nuevo insight
  const createInsight = async (insight: Omit<AIInsight, "id" | "created_at">): Promise<AIInsight> => {
    const { data, error } = await supabase
      .from("ai_insights")
      .insert(insight)
      .select()
      .single();

    if (error) {
      console.error("Error creating insight:", error);
      throw error;
    }

    return data as unknown as AIInsight;
  };

  // Generar datos de métricas a partir de datos de tareas, hábitos, etc.
  const generateTaskMetrics = async (startDate: string, endDate: string, period: AnalyticsPeriod): Promise<AnalyticsMetric> => {
    // Obtener tareas completadas en el período
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "completed")
      .gte("due_date", startDate)
      .lte("due_date", endDate)
      .order("due_date");

    if (tasksError) {
      console.error("Error generating task metrics:", tasksError);
      throw tasksError;
    }

    type TaskPriority = 'low' | 'medium' | 'high';
    
    // Agrupar tareas por fecha y prioridad
    const tasksByDate = tasksData.reduce((acc, task) => {
      const date = new Date(task.due_date as string).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { low: 0, medium: 0, high: 0, total: 0 };
      }
      acc[date][task.priority as TaskPriority]++;
      acc[date].total++;
      return acc;
    }, {} as Record<string, { low: number; medium: number; high: number; total: number }>);

    // Convertir a formato para almacenar en la base de datos
    const formattedData = Object.entries(tasksByDate).map(([date, counts]) => ({
      date,
      low: counts.low as number,
      medium: counts.medium as number,
      high: counts.high as number,
      total: counts.total as number
    }));

    // Crear la métrica
    const metricData = {
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      metric_type: "tasks_completed" as MetricType,
      period,
      start_date: startDate,
      end_date: endDate,
      data: formattedData
    };

    return await upsertMetric(metricData);
  };

  // Generar datos de hábitos
  const generateHabitMetrics = async (startDate: string, endDate: string, period: AnalyticsPeriod): Promise<AnalyticsMetric> => {
    // Implementación similar a la anterior pero para hábitos
    // Aquí deberías consultar la tabla de hábitos y calcular las rayas (streaks)
    
    // Este es un ejemplo simplificado
    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("id, name, completions:habit_completions(*)");

    if (habitsError) {
      console.error("Error generating habit metrics:", habitsError);
      throw habitsError;
    }

    // Cálculo de streaks para cada hábito
    // Este es un cálculo de ejemplo, el real dependería de tu implementación de hábitos
    const habitStreaks = habitsData.map(habit => ({
      habitId: habit.id,
      habitName: habit.name,
      streak: (habit.completions as any[]).length, // Simplificado, en realidad habría que calcular las rachas consecutivas
      date: new Date().toISOString().split("T")[0]
    }));

    // Crear la métrica
    const metricData = {
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      metric_type: "habits_streaks" as MetricType,
      period,
      start_date: startDate,
      end_date: endDate,
      data: habitStreaks
    };

    return await upsertMetric(metricData);
  };

  // Generar métricas financieras
  const generateFinancialMetrics = async (startDate: string, endDate: string, period: AnalyticsPeriod): Promise<AnalyticsMetric> => {
    // Obtener transacciones en el período
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    if (transactionsError) {
      console.error("Error generating financial metrics:", transactionsError);
      throw transactionsError;
    }

    // Agrupar por fecha y tipo (ingreso/gasto)
    const financialByDate = transactionsData.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0, categories: {} as Record<string, number> };
      }
      if (transaction.type === "income") {
        acc[date].income += Number(transaction.amount);
      } else {
        acc[date].expense += Number(transaction.amount);
      }
      
      // Agrupar por categoría
      if (!acc[date].categories[transaction.category]) {
        acc[date].categories[transaction.category] = 0;
      }
      acc[date].categories[transaction.category] += Number(transaction.amount);
      
      return acc;
    }, {} as Record<string, { income: number; expense: number; categories: Record<string, number> }>);

    // Convertir a formato para almacenar en la base de datos
    const formattedData = Object.entries(financialByDate).map(([date, data]) => ({
      date,
      income: data.income as number,
      expense: data.expense as number,
      categories: data.categories as Record<string, number>
    }));

    // Crear la métrica
    const metricData = {
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      metric_type: "financial_spending" as MetricType,
      period,
      start_date: startDate,
      end_date: endDate,
      data: formattedData
    };

    return await upsertMetric(metricData);
  };

  // Generar métricas de progreso de metas
  const generateGoalMetrics = async (startDate: string, endDate: string, period: AnalyticsPeriod): Promise<AnalyticsMetric> => {
    // Obtener metas y su progreso
    const { data: goalsData, error: goalsError } = await supabase
      .from("financial_goals")
      .select("*");

    if (goalsError) {
      console.error("Error generating goal metrics:", goalsError);
      throw goalsError;
    }

    // Calcular progreso
    const goalProgress = goalsData.map(goal => ({
      goalId: goal.id,
      goalName: goal.name,
      target: goal.target_amount,
      current: goal.current_amount,
      progress: (goal.current_amount / goal.target_amount) * 100,
      date: new Date().toISOString().split("T")[0]
    }));

    // Crear la métrica
    const metricData = {
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      metric_type: "goals_progress" as MetricType,
      period,
      start_date: startDate,
      end_date: endDate,
      data: goalProgress
    };

    return await upsertMetric(metricData);
  };

  // Generar insights basados en métricas
  const generateInsights = async (): Promise<AIInsight[]> => {
    // Obtener todas las métricas recientes
    const { data: metricsData, error: metricsError } = await supabase
      .from("analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (metricsError) {
      console.error("Error fetching metrics for insights:", metricsError);
      throw metricsError;
    }

    // Aquí se implementaría la lógica real para generar insights basados en patrones
    // Por ahora, crearemos algunos insights de ejemplo

    const productivityInsight = {
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      insight_type: "productivity" as InsightType,
      description: "Has completado más tareas de alta prioridad esta semana que la semana pasada",
      relevance: 85,
      data: {
        thisWeek: 12,
        lastWeek: 8,
        improvement: 50
      },
      related_metrics: [
        metricsData.find(m => m.metric_type === "tasks_completed")?.id
      ]
    };

    // Crear el insight en la base de datos
    const createdInsight = await createInsight(productivityInsight);
    return [createdInsight];
  };

  return {
    getMetrics,
    upsertMetric,
    getInsights,
    createInsight,
    generateTaskMetrics,
    generateHabitMetrics,
    generateFinancialMetrics,
    generateGoalMetrics,
    generateInsights
  };
};

export const analyticsService = createAnalyticsService(); 
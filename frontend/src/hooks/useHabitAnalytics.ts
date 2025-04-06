import { useQuery } from '@tanstack/react-query';

interface HabitAnalyticsData {
  current_month_completions: number;
  last_month_completions: number;
  habits_by_category: {
    [key: string]: number;
  };
  completion_trend: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  current_week_completions: number;
  last_week_completions: number;
  improvement_percentage: number;
  total_active_habits: number;
  best_performing_category: string;
  streak_data: {
    current_streak: number;
    best_streak: number;
    average_streak: number;
  };
}

export function useHabitAnalytics() {
  return useQuery<HabitAnalyticsData>({
    queryKey: ['habitAnalytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/habits');
      if (!response.ok) {
        throw new Error('Error al obtener datos de análisis de hábitos');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
} 
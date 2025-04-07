import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface HabitStreak {
  habit_name: string;
  current_streak: number;
  best_streak: number;
  completion_rate: number;
}

interface DailyCompletion {
  date: string;
  completed_count: number;
  total_count: number;
  completion_rate: number;
}

interface HeatmapData {
  date: string;
  value: number;
}

interface HabitsAnalyticsData {
  habit_streaks: HabitStreak[];
  daily_completions: DailyCompletion[];
  completion_heatmap: HeatmapData[];
}

export function useHabitsAnalytics() {
  const { user } = useAuth();

  return useQuery<HabitsAnalyticsData>({
    queryKey: ['habits-analytics', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuario no autenticado');
      
      const response = await api.get('/api/v1/habits/analytics');
      return response.data;
    },
    enabled: !!user,
  });
} 
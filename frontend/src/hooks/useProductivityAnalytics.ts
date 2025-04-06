import { useQuery } from '@tanstack/react-query';

interface ProductivityData {
  current_week_high_priority: number;
  last_week_high_priority: number;
  tasks_by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  tasks_completion_trend: Array<{
    date: string;
    completed: number;
  }>;
}

export function useProductivityAnalytics() {
  return useQuery<ProductivityData>({
    queryKey: ['productivityAnalytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/productivity');
      if (!response.ok) {
        throw new Error('Error al obtener datos de productividad');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
} 
'use client';

import { useQuery } from '@tanstack/react-query';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpenseTrend {
  date: string;
  income: number;
  expense: number;
}

interface FinanceAnalyticsData {
  expenses_by_category: ExpenseCategory[];
  expense_trend: ExpenseTrend[];
}

export function useFinanceAnalytics() {
  return useQuery<FinanceAnalyticsData>({
    queryKey: ['financeAnalytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/finances');
      if (!response.ok) {
        throw new Error('Error al obtener datos de análisis financiero');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
} 
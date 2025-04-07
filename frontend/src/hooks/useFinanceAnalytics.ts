'use client';

import { useQuery } from '@tanstack/react-query';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface Subscription {
  name: string;
  amount: number;
  billing_cycle: string;
}

interface FinanceData {
  expenses_by_category: ExpenseCategory[];
  expense_trend: Array<{
    date: string;
    amount: number;
  }>;
  subscriptions: Subscription[];
}

export function useFinanceAnalytics() {
  return useQuery<FinanceData>({
    queryKey: ['financeAnalytics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/finance');
      if (!response.ok) {
        throw new Error('Error al obtener datos financieros');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
} 
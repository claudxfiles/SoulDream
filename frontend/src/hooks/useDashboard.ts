import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

interface FinancialAsset {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Transaction[];
  financialGoals: FinancialAsset[];
}

export const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    recentTransactions: [],
    financialGoals: []
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Obtener el primer y último día del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]; // Formato YYYY-MM-DD
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]; // Formato YYYY-MM-DD

      // Obtener transacciones del mes actual
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Obtener metas financieras
      const { data: goals, error: goalsError } = await supabase
        .from('financial_assets')
        .select('*')
        .order('target_date', { ascending: true });

      if (goalsError) throw goalsError;

      // Calcular totales
      const monthlyIncome = transactions
        ?.filter(t => t.type.toLowerCase() === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpenses = transactions
        ?.filter(t => t.type.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const currentBalance = monthlyIncome - monthlyExpenses;

      setData({
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        recentTransactions: transactions?.slice(0, 5) || [],
        financialGoals: goals || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    ...data,
    isLoading,
    refresh: fetchDashboardData
  };
}; 
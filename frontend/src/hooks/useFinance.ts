import { useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  FinancialGoal,
  Subscription,
  FinancialSummary,
  FinancialAsset,
  SavingsPlan,
  getTransactions,
  getFinancialGoals,
  getSubscriptions,
  getFinancialSummary,
  getFinancialAssets,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createFinancialGoal,
  updateFinancialGoal,
  deleteFinancialGoal,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  createFinancialAsset,
  updateFinancialAsset,
  deleteFinancialAsset,
  calculateLoanPayment,
  calculateCompoundInterest,
  getSavingsPlan,
  createOrUpdateSavingsPlan,
  getMonthlyFinancialSummary
} from '@/lib/finance';
import { toast } from '@/components/ui/use-toast';

export function useFinance() {
  // Estados
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [financialAssets, setFinancialAssets] = useState<FinancialAsset[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState({
    transactions: false,
    goals: false,
    subscriptions: false,
    assets: false,
    summary: false
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: ''
  });
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>(null);
  const [isLoadingSavingsPlan, setIsLoadingSavingsPlan] = useState(false);

  // Funciones para cargar datos
  const fetchTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const data = await getTransactions({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        type: filters.type as 'income' | 'expense' | undefined,
        category: filters.category || undefined
      });
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las transacciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [filters.startDate, filters.endDate, filters.type, filters.category]);

  const fetchFinancialGoals = useCallback(async () => {
    setLoading(prev => ({ ...prev, goals: true }));
    try {
      const data = await getFinancialGoals();
      setFinancialGoals(data);
    } catch (error) {
      console.error('Error fetching financial goals:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las metas financieras',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, goals: false }));
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(prev => ({ ...prev, subscriptions: true }));
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las suscripciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, subscriptions: false }));
    }
  }, []);

  const fetchFinancialAssets = useCallback(async () => {
    setLoading(prev => ({ ...prev, assets: true }));
    try {
      const data = await getFinancialAssets();
      setFinancialAssets(data);
    } catch (error) {
      console.error('Error fetching financial assets:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los activos financieros',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, assets: false }));
    }
  }, []);

  const fetchSummary = useCallback(async (period: 'month' | 'year' = 'month') => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const data = await getFinancialSummary(period);
      setSummary(data);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen financiero',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, []);

  // Función para cargar el plan de ahorro
  const fetchSavingsPlan = useCallback(async () => {
    setIsLoadingSavingsPlan(true);
    try {
      const plan = await getSavingsPlan();
      setSavingsPlan(plan);
    } catch (error) {
      console.error('Error fetching savings plan:', error);
    } finally {
      setIsLoadingSavingsPlan(false);
    }
  }, []);

  // Función para guardar o actualizar el plan de ahorro
  const saveSavingsPlan = useCallback(async (plan: SavingsPlan) => {
    try {
      const updatedPlan = await createOrUpdateSavingsPlan(plan);
      if (updatedPlan) {
        setSavingsPlan(updatedPlan);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving savings plan:', error);
      return false;
    }
  }, []);

  // Función para obtener el resumen financiero mensual
  const fetchMonthlyFinancialSummary = useCallback(async () => {
    try {
      const summary = await getMonthlyFinancialSummary();
      return summary;
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      return null;
    }
  }, []);

  // Cargar datos al iniciar
  useEffect(() => {
    fetchTransactions();
    fetchFinancialGoals();
    fetchSubscriptions();
    fetchFinancialAssets();
    fetchSummary();
    fetchSavingsPlan();
  }, [fetchTransactions, fetchFinancialGoals, fetchSubscriptions, fetchFinancialAssets, fetchSummary, fetchSavingsPlan]);

  // Funciones CRUD para transacciones
  const addTransaction = async (transaction: Transaction): Promise<boolean> => {
    try {
      const newTransaction = await createTransaction(transaction);
      if (newTransaction) {
        setTransactions(prev => [newTransaction, ...prev]);
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  const editTransaction = async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
    try {
      const success = await updateTransaction(id, updates);
      if (success) {
        setTransactions(prev => 
          prev.map(t => t.id === id ? { ...t, ...updates } : t)
        );
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
  };

  const removeTransaction = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  };

  // Funciones CRUD para metas financieras
  const addFinancialGoal = async (goal: FinancialGoal): Promise<boolean> => {
    try {
      const newGoal = await createFinancialGoal(goal);
      if (newGoal) {
        setFinancialGoals(prev => [newGoal, ...prev]);
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding financial goal:', error);
      return false;
    }
  };

  const editFinancialGoal = async (id: string, updates: Partial<FinancialGoal>): Promise<boolean> => {
    try {
      const success = await updateFinancialGoal(id, updates);
      if (success) {
        setFinancialGoals(prev => 
          prev.map(g => g.id === id ? { ...g, ...updates } : g)
        );
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating financial goal:', error);
      return false;
    }
  };

  const removeFinancialGoal = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteFinancialGoal(id);
      if (success) {
        setFinancialGoals(prev => prev.filter(g => g.id !== id));
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting financial goal:', error);
      return false;
    }
  };

  // Funciones CRUD para suscripciones
  const addSubscription = async (subscription: Subscription): Promise<boolean> => {
    try {
      const newSubscription = await createSubscription(subscription);
      if (newSubscription) {
        setSubscriptions(prev => [newSubscription, ...prev]);
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding subscription:', error);
      return false;
    }
  };

  const editSubscription = async (id: string, updates: Partial<Subscription>): Promise<boolean> => {
    try {
      const success = await updateSubscription(id, updates);
      if (success) {
        setSubscriptions(prev => 
          prev.map(s => s.id === id ? { ...s, ...updates } : s)
        );
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  };

  const removeSubscription = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteSubscription(id);
      if (success) {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return false;
    }
  };

  // Funciones CRUD para activos financieros
  const addFinancialAsset = async (asset: FinancialAsset): Promise<boolean> => {
    try {
      const newAsset = await createFinancialAsset(asset);
      if (newAsset) {
        setFinancialAssets(prev => [newAsset, ...prev]);
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding financial asset:', error);
      return false;
    }
  };

  const editFinancialAsset = async (id: string, updates: Partial<FinancialAsset>): Promise<boolean> => {
    try {
      const success = await updateFinancialAsset(id, updates);
      if (success) {
        setFinancialAssets(prev => 
          prev.map(a => a.id === id ? { ...a, ...updates } : a)
        );
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating financial asset:', error);
      return false;
    }
  };

  const removeFinancialAsset = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteFinancialAsset(id);
      if (success) {
        setFinancialAssets(prev => prev.filter(a => a.id !== id));
        // Actualizar el resumen
        fetchSummary();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting financial asset:', error);
      return false;
    }
  };

  // Funciones de cálculo financiero
  const calculateMonthlyPayment = (principal: number, interestRate: number, termYears: number): number => {
    return calculateLoanPayment(principal, interestRate, termYears);
  };

  const calculateInvestmentGrowth = (
    principal: number,
    interestRate: number,
    timeYears: number,
    compoundingFrequency: number = 12
  ): number => {
    return calculateCompoundInterest(principal, interestRate, timeYears, compoundingFrequency);
  };

  // Función para cambiar filtros
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Función para el análisis financiero
  const getSavingsRecommendation = (): { amount: number; message: string } => {
    if (!summary) {
      return { amount: 0, message: 'Cargando recomendación...' };
    }

    const income = summary.income;
    // Regla general: ahorrar al menos 20% de los ingresos
    const recommendedSavings = income * 0.2;
    const currentSavings = summary.monthlySavings;
    
    if (currentSavings >= recommendedSavings) {
      return {
        amount: currentSavings,
        message: `¡Excelente! Estás ahorrando ${currentSavings.toFixed(2)} que es más del 20% recomendado.`
      };
    } else if (currentSavings > 0) {
      const deficit = recommendedSavings - currentSavings;
      return {
        amount: recommendedSavings,
        message: `Estás ahorrando ${currentSavings.toFixed(2)}. Considera aumentar tus ahorros en ${deficit.toFixed(2)} para alcanzar el 20% recomendado.`
      };
    } else {
      return {
        amount: recommendedSavings,
        message: `Actualmente no estás ahorrando. Intenta ahorrar al menos ${recommendedSavings.toFixed(2)} (20% de tus ingresos).`
      };
    }
  };

  const getExpenseBreakdown = (): { category: string; amount: number; percentage: number }[] => {
    if (!transactions.length) return [];
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Agrupar por categoría
    const categoryMap = expenses.reduce((acc, transaction) => {
      const { category, amount } = transaction;
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Convertir a array y calcular porcentajes
    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  };

  // Retornar todos los datos y funciones
  return {
    // Datos
    transactions,
    financialGoals,
    subscriptions,
    financialAssets,
    summary,
    loading,
    filters,
    savingsPlan,
    isLoadingSavingsPlan,
    
    // Funciones de carga
    fetchTransactions,
    fetchFinancialGoals,
    fetchSubscriptions,
    fetchFinancialAssets,
    fetchSummary,
    fetchSavingsPlan,
    fetchMonthlyFinancialSummary,
    
    // Funciones CRUD - Transacciones
    addTransaction,
    editTransaction,
    removeTransaction,
    
    // Funciones CRUD - Metas financieras
    addFinancialGoal,
    editFinancialGoal,
    removeFinancialGoal,
    
    // Funciones CRUD - Suscripciones
    addSubscription,
    editSubscription,
    removeSubscription,
    
    // Funciones CRUD - Activos financieros
    addFinancialAsset,
    editFinancialAsset,
    removeFinancialAsset,
    
    // Funciones de cálculo
    calculateMonthlyPayment,
    calculateInvestmentGrowth,
    
    // Filtros
    updateFilters,
    
    // Análisis financiero
    getSavingsRecommendation,
    getExpenseBreakdown,
    
    // Funciones para el plan de ahorro
    saveSavingsPlan
  };
} 
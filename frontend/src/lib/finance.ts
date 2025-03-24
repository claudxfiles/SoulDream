import { getSupabaseClient } from './supabase';
import { toast } from '@/components/ui/use-toast';

// Tipos
export interface Transaction {
  id?: string;
  user_id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialGoal {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: string;
  type: 'savings' | 'debt_payoff' | 'purchase';
  created_at?: string;
  updated_at?: string;
  visualization_image_url?: string;
  milestones?: FinancialMilestone[];
  automatic_savings_amount?: number;
  automatic_savings_frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface FinancialMilestone {
  id?: string;
  goal_id?: string;
  title: string;
  amount: number;
  target_date?: string;
  reached: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id?: string;
  user_id?: string;
  service_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  category: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  reminder_days_before?: number;
}

export interface FinancialEducationContent {
  id: string;
  title: string;
  content: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  reading_time: number; // in minutes
}

export interface FinancialAsset {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  acquisition_price: number;
  current_value: number;
  acquisition_date: string;
  category: 'property' | 'vehicle' | 'investment' | 'other';
  image_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  balance: number;
  income: number;
  expenses: number;
  savingsGoalProgress: number;
  monthlySavings: number;
  subscriptionsTotal: number;
}

// Categorías predefinidas para ingresos
export const incomeCategories = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Regalos',
  'Reembolsos',
  'Otros ingresos'
];

// Categorías predefinidas para gastos
export const expenseCategories = [
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Ropa',
  'Servicios',
  'Deudas',
  'Suscripciones',
  'Regalos',
  'Otros gastos'
];

// Funciones para transacciones
export const createTransaction = async (transaction: Transaction): Promise<Transaction | null> => {
  try {
    const supabase = getSupabaseClient();
    
    // Asegurar que tiene un user_id, si no está usando RLS
    if (!transaction.user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) transaction.user_id = user.id;
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la transacción',
        variant: 'destructive',
      });
      return null;
    }
    
    toast({
      title: 'Transacción creada',
      description: 'La transacción se ha registrado correctamente',
    });
    
    return data;
  } catch (error) {
    console.error('Error in createTransaction:', error);
    return null;
  }
};

export const getTransactions = async (
  filters?: { 
    startDate?: string; 
    endDate?: string; 
    type?: 'income' | 'expense'; 
    category?: string;
    limit?: number;
  }
): Promise<Transaction[]> => {
  try {
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    // Aplicar filtros
    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTransactions:', error);
    return [];
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la transacción',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Transacción actualizada',
      description: 'La transacción se ha actualizado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    return false;
  }
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la transacción',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Transacción eliminada',
      description: 'La transacción se ha eliminado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    return false;
  }
};

// Funciones para metas financieras
export const createFinancialGoal = async (goal: FinancialGoal): Promise<FinancialGoal | null> => {
  try {
    const supabase = getSupabaseClient();
    
    // Asegurar que tiene un user_id, si no está usando RLS
    if (!goal.user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) goal.user_id = user.id;
    }
    
    const { data, error } = await supabase
      .from('financial_goals')
      .insert(goal)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating financial goal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la meta financiera',
        variant: 'destructive',
      });
      return null;
    }
    
    toast({
      title: 'Meta creada',
      description: 'La meta financiera se ha creado correctamente',
    });
    
    return data;
  } catch (error) {
    console.error('Error in createFinancialGoal:', error);
    return null;
  }
};

export const getFinancialGoals = async (): Promise<FinancialGoal[]> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching financial goals:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getFinancialGoals:', error);
    return [];
  }
};

export const updateFinancialGoal = async (id: string, updates: Partial<FinancialGoal>): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating financial goal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la meta financiera',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Meta actualizada',
      description: 'La meta financiera se ha actualizado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in updateFinancialGoal:', error);
    return false;
  }
};

export const deleteFinancialGoal = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting financial goal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la meta financiera',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Meta eliminada',
      description: 'La meta financiera se ha eliminado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteFinancialGoal:', error);
    return false;
  }
};

// Funciones para subscripciones
export const createSubscription = async (subscription: Subscription): Promise<Subscription | null> => {
  try {
    const supabase = getSupabaseClient();
    
    // Asegurar que tiene un user_id, si no está usando RLS
    if (!subscription.user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) subscription.user_id = user.id;
    }
    
    const { data, error } = await supabase
      .from('subscriptions_tracker')
      .insert(subscription)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la suscripción',
        variant: 'destructive',
      });
      return null;
    }
    
    toast({
      title: 'Suscripción creada',
      description: 'La suscripción se ha registrado correctamente',
    });
    
    return data;
  } catch (error) {
    console.error('Error in createSubscription:', error);
    return null;
  }
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('subscriptions_tracker')
      .select('*')
      .order('next_billing_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getSubscriptions:', error);
    return [];
  }
};

export const updateSubscription = async (id: string, updates: Partial<Subscription>): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('subscriptions_tracker')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la suscripción',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Suscripción actualizada',
      description: 'La suscripción se ha actualizado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    return false;
  }
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('subscriptions_tracker')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la suscripción',
        variant: 'destructive',
      });
      return false;
    }
    
    toast({
      title: 'Suscripción eliminada',
      description: 'La suscripción se ha eliminado correctamente',
    });
    
    return true;
  } catch (error) {
    console.error('Error in deleteSubscription:', error);
    return false;
  }
};

// Función para obtener un resumen financiero
export const getFinancialSummary = async (
  period: 'month' | 'year' = 'month'
): Promise<FinancialSummary | null> => {
  try {
    const supabase = getSupabaseClient();
    
    // Determinar fechas para el periodo
    const now = new Date();
    let startDate: string;
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }
    
    const endDate = now.toISOString();
    
    // Obtener las transacciones del período
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return null;
    }
    
    // Obtener las suscripciones
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions_tracker')
      .select('*');
    
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
    }
    
    // Obtener las metas financieras
    const { data: goals, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*');
    
    if (goalsError) {
      console.error('Error fetching financial goals:', goalsError);
    }
    
    // Calcular el resumen
    const income = transactions
      ? transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;
    
    const expenses = transactions
      ? transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;
    
    const balance = income - expenses;
    
    const subscriptionsTotal = subscriptions
      ? subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)
      : 0;
    
    // Calcular progreso de metas de ahorro
    const totalSavingsGoals = goals
      ? goals
          .filter(g => g.type === 'savings')
          .reduce((sum, g) => sum + (g.target_amount || 0), 0)
      : 0;
    
    const currentSavingsProgress = goals
      ? goals
          .filter(g => g.type === 'savings')
          .reduce((sum, g) => sum + (g.current_amount || 0), 0)
      : 0;
    
    const savingsGoalProgress = totalSavingsGoals > 0
      ? (currentSavingsProgress / totalSavingsGoals) * 100
      : 0;
    
    // Calcular ahorro mensual (ingresos - gastos)
    const monthlySavings = income - expenses;
    
    return {
      balance,
      income,
      expenses,
      savingsGoalProgress,
      monthlySavings,
      subscriptionsTotal
    };
  } catch (error) {
    console.error('Error in getFinancialSummary:', error);
    return null;
  }
};

// Hook personalizado para cálculos financieros
export const calculateLoanPayment = (
  principal: number,
  interestRate: number,
  termYears: number
): number => {
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;
  
  if (monthlyRate === 0) return principal / numPayments;
  
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return payment;
};

export const calculateCompoundInterest = (
  principal: number,
  interestRate: number,
  timeYears: number,
  compoundingFrequency: number = 12
): number => {
  const rate = interestRate / 100;
  const totalAmount = principal * Math.pow(
    1 + rate / compoundingFrequency,
    compoundingFrequency * timeYears
  );
  
  return totalAmount;
}; 
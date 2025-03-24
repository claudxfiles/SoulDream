/**
 * Tipos relacionados con finanzas
 */

export interface FinanceTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  related_goal_id?: string;
  created_at: string;
  payment_method?: string;
  recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
}

export interface FinanceGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  type: 'savings' | 'debt_payoff' | 'purchase';
  target_date: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  visualization_image_url?: string;
  related_goal_id?: string;
  automatic_savings_amount?: number;
  automatic_savings_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  milestones?: {
    amount: number;
    title: string;
    reached: boolean;
  }[];
}

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  next_billing_date: string;
  category: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  reminder_days_before: number;
}

export interface Budget {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  current_spending: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  recurring: boolean;
}

export interface FinancialSnapshot {
  date: string;
  total_income: number;
  total_expenses: number;
  savings_rate: number;
  net_worth: number;
  monthly_budget: number;
  monthly_spending: number;
  savings_goals_progress: {
    goal_id: string;
    title: string;
    progress_percentage: number;
  }[];
}

export interface TransactionCreateDTO {
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  related_goal_id?: string;
  payment_method?: string;
  recurring?: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  tags?: string[];
} 
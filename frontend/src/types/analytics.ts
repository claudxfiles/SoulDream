import { Json } from "./supabase";

export type MetricType = 
  | "tasks_completed" 
  | "task_completion_time" 
  | "habits_streaks"
  | "financial_spending" 
  | "financial_saving" 
  | "goals_progress";

export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type InsightType = 
  | "productivity" 
  | "habits" 
  | "financial" 
  | "goal_achievement" 
  | "time_management" 
  | "prediction";

export interface AnalyticsMetric {
  id: string;
  user_id: string;
  metric_type: MetricType;
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  data: Json;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  description: string;
  data: Json;
  relevance: number;
  created_at: string;
  related_metrics: Json;
}

export type TaskCompletionData = {
  date: string;
  count: number;
  priority?: "low" | "medium" | "high";
};

export type HabitStreakData = {
  date: string;
  habitId: string;
  habitName: string;
  streak: number;
};

export type FinancialData = {
  date: string;
  amount: number;
  category: string;
};

export type GoalProgressData = {
  date: string;
  goalId: string;
  goalName: string;
  progress: number; // 0-100
};

export type TimeManagementData = {
  date: string;
  category: string;
  timeSpent: number; // minutes
};

export type PredictionData = {
  date: string;
  metric: string;
  predictedValue: number;
  confidence: number; // 0-100
}; 
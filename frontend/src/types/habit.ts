export type Habit = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  specific_days?: number[] | null;
  category?: string;
  reminder_time?: string;
  cue?: string;
  reward?: string;
  current_streak: number;
  best_streak: number;
  goal_value?: number;
  total_completions?: number;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  related_goal_id?: string;
  isCompletedToday?: boolean;
};

export type HabitCreate = {
  title: string;
  description?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  specific_days?: number[] | null;
  goal_value?: number;
  category?: string | null;
  is_active?: boolean;
};

export type HabitUpdate = Partial<HabitCreate>;

export type HabitLog = {
  id: string;
  habit_id: string;
  completed_date: string;
  notes?: string;
  quality_rating?: number;
  emotion?: string;
  created_at: string;
  value?: number;
};

export type HabitLogCreate = {
  habit_id: string;
  completed_date: string;
  notes?: string | null;
  quality_rating?: number | null;
  emotion?: string | null;
  value?: number | null;
};

export type HabitWithLogsAndProgress = Habit & {
  logs?: HabitLog[];
  progressToday: boolean;
  progressThisWeek: number;
};

export type HabitCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const HABIT_CATEGORIES = [
  { id: 'salud', name: 'Salud', icon: '💪', color: '#10b981' },
  { id: 'fitness', name: 'Fitness', icon: '🏃', color: '#f97316' },
  { id: 'productividad', name: 'Productividad', icon: '⏱️', color: '#3b82f6' },
  { id: 'aprendizaje', name: 'Aprendizaje', icon: '📚', color: '#8b5cf6' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', color: '#06b6d4' },
  { id: 'personal', name: 'Personal', icon: '❤️', color: '#ec4899' },
  { id: 'finanzas', name: 'Finanzas', icon: '💰', color: '#14b8a6' },
  { id: 'otros', name: 'Otros', icon: '🔄', color: '#6b7280' },
]; 
/**
 * Tipos relacionados con el perfil de usuario
 */

export interface ProfileData {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  subscription_tier: 'free' | 'pro' | 'business';
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean;
  theme_preference?: 'light' | 'dark' | 'system';
  language_preference?: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  theme_preference?: 'light' | 'dark' | 'system';
  language_preference?: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications?: boolean;
  goal_reminders?: boolean;
  task_reminders?: boolean;
  habit_reminders?: boolean;
  workout_reminders?: boolean;
  financial_alerts?: boolean;
}

export interface UserStats {
  tasks_completed: number;
  goals_achieved: number;
  habits_streak: number;
  streak_days: number;
  total_workouts: number;
  total_savings: number;
  days_active: number;
  joined_date: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  start_day_of_week: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  currency: string;
  time_format: '12h' | '24h';
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications: NotificationSettings;
} 
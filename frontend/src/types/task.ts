/**
 * Tipos relacionados con tareas
 */

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  column_order?: number;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  related_goal_id?: string;
  category?: string;
  tags?: string[];
  estimated_time_minutes?: number;
  completed_at?: string;
}

export interface TaskCreateDTO {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  related_goal_id?: string;
  category?: string;
  tags?: string[];
  estimated_time_minutes?: number;
}

export interface TaskUpdateDTO {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'canceled';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  column_order?: number;
  related_goal_id?: string | null;
  category?: string;
  tags?: string[];
  estimated_time_minutes?: number | null;
}

export interface TaskFilters {
  status?: ('pending' | 'in_progress' | 'completed')[];
  priority?: ('low' | 'medium' | 'high')[];
  dueDate?: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'this_month' | 'overdue' | 'no_date';
  category?: string[];
  tags?: string[];
  search?: string;
  relatedGoalId?: string;
}

export interface TaskSortOptions {
  field: 'due_date' | 'priority' | 'created_at' | 'title';
  direction: 'asc' | 'desc';
} 
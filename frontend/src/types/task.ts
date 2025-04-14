/**
 * Tipos relacionados con tareas
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  related_goal_id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  due_date?: string;
  tags: string[];
}

export interface TaskCreateDTO {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  related_goal_id?: string;
  category?: 'performance' | 'feature' | 'bug' | 'documentation' | 'other';
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
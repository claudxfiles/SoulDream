export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  due_time?: string;
  timezone?: string;
  duration_minutes?: number;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  related_goal_id?: string;
} 
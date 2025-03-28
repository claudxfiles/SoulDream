export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  category?: 'performance' | 'feature' | 'bug' | 'documentation' | 'other';
} 
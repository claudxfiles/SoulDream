import { supabase } from '@/lib/supabase';
import { Task } from '@/types/tasks';

export const taskService = {
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTask(task: Omit<Task, 'id'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, task: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 
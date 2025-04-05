import { supabase } from '@/lib/supabase';
import { Goal, GoalStep } from '@/types/goals';

export class GoalsService {
  static async getGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getGoalById(id: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateGoal(id: string, updates: Partial<Goal>) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getGoalSteps(goalId: string) {
    const { data, error } = await supabase
      .from('goal_steps')
      .select('*')
      .eq('goal_id', goalId)
      .order('orderindex', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async createGoalStep(step: Omit<GoalStep, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('goal_steps')
      .insert([step])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateGoalStep(id: string, updates: Partial<GoalStep>) {
    const { data, error } = await supabase
      .from('goal_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteGoalStep(id: string) {
    const { error } = await supabase
      .from('goal_steps')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
} 
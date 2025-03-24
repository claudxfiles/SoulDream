import { supabase } from '@/lib/supabase';
import { Goal, SubGoal, GoalStep } from '@/store/goals/useGoalsStore';

export class GoalsService {
  static async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
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
  }

  static async getGoalsByUserId(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createSubGoal(subGoal: Omit<SubGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...subGoal, parentGoalId: subGoal.parentGoalId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createGoalStep(goalStep: Omit<GoalStep, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('goal_steps')
      .insert([goalStep])
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

  static async getGoalSteps(goalId: string) {
    const { data, error } = await supabase
      .from('goal_steps')
      .select('*')
      .eq('goalId', goalId)
      .order('orderIndex', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getSubGoals(parentGoalId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('parentGoalId', parentGoalId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async updateGoalProgress(id: string, progressPercentage: number) {
    const { data, error } = await supabase
      .from('goals')
      .update({ progressPercentage })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 
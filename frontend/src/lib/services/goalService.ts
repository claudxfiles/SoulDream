import { supabase } from '@/lib/supabase';
import { 
    Goal, 
    GoalUpdate, 
    GoalSubtask, 
    CreateGoalInput, 
    UpdateGoalInput,
    GoalStats 
} from '@/types/goals';

export class GoalService {
    static async getGoals(): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getGoalById(id: string): Promise<Goal | null> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async createGoal(goal: CreateGoalInput): Promise<Goal> {
        const { data, error } = await supabase
            .from('goals')
            .insert(goal)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateGoal(id: string, updates: UpdateGoalInput): Promise<Goal> {
        const { data, error } = await supabase
            .from('goals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteGoal(id: string): Promise<void> {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async getGoalUpdates(goalId: string): Promise<GoalUpdate[]> {
        const { data, error } = await supabase
            .from('goal_updates')
            .select('*')
            .eq('goal_id', goalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async addGoalUpdate(
        goalId: string, 
        previousValue: number, 
        newValue: number, 
        note?: string
    ): Promise<GoalUpdate> {
        const { data, error } = await supabase
            .from('goal_updates')
            .insert({
                goal_id: goalId,
                previous_value: previousValue,
                new_value: newValue,
                note
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getGoalSubtasks(goalId: string): Promise<GoalSubtask[]> {
        const { data, error } = await supabase
            .from('goal_subtasks')
            .select('*')
            .eq('goal_id', goalId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    static async addSubtask(goalId: string, title: string): Promise<GoalSubtask> {
        const { data, error } = await supabase
            .from('goal_subtasks')
            .insert({
                goal_id: goalId,
                title
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async updateSubtask(
        id: string, 
        updates: Partial<Pick<GoalSubtask, 'title' | 'completed'>>
    ): Promise<GoalSubtask> {
        const { data, error } = await supabase
            .from('goal_subtasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteSubtask(id: string): Promise<void> {
        const { error } = await supabase
            .from('goal_subtasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async getGoalStats(): Promise<GoalStats> {
        const { data: goals, error } = await supabase
            .from('goals')
            .select('status');

        if (error) throw error;

        const total = goals.length;
        const completed = goals.filter(g => g.status === 'completed').length;
        const inProgress = goals.filter(g => g.status === 'active').length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return {
            total,
            completed,
            inProgress,
            completionRate
        };
    }
} 
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Tipo para las metas
export interface Goal {
  id: string;
  title: string;
  description?: string;
  area?: string;
  target_date?: string;
  progress_percentage?: number;
  status?: 'active' | 'completed' | 'abandoned';
  created_at?: string;
  updated_at?: string;
  parent_goal_id?: string;
  priority?: 'low' | 'medium' | 'high';
  visualization_image_url?: string;
  type?: string;
}

/**
 * Hook para obtener las metas del usuario actual
 */
export function useGetUserGoals() {
  const { user } = useAuth();
  
  return useQuery<Goal[]>({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook para obtener una meta específica por ID
 */
export function useGetGoalById(goalId?: string) {
  return useQuery<Goal | null>({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      if (!goalId) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    enabled: !!goalId,
  });
} 
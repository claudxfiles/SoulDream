import { Goal, GoalStep, GoalWithSteps } from '@/types/goal';
import { supabase } from './supabase';

/**
 * Servicio para gestionar las metas
 */

/**
 * Obtiene todas las metas del usuario
 * @returns Lista de metas
 */
export async function getGoals(): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener metas:', error);
    return [];
  }
}

/**
 * Obtiene una meta por su ID
 * @param id ID de la meta
 * @returns Meta con sus pasos
 */
export async function getGoalById(id: string): Promise<GoalWithSteps | null> {
  try {
    // Obtener la meta
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (goalError) throw goalError;
    if (!goalData) return null;
    
    // Obtener los pasos de la meta
    const { data: stepsData, error: stepsError } = await supabase
      .from('goal_steps')
      .select('*')
      .eq('goal_id', id)
      .order('order_index', { ascending: true });
    
    if (stepsError) throw stepsError;
    
    // Combinar meta con pasos
    return {
      ...goalData,
      steps: stepsData || []
    };
  } catch (error) {
    console.error('Error al obtener meta por ID:', error);
    return null;
  }
}

/**
 * Crea una nueva meta
 * @param goal Datos de la meta
 * @returns Meta creada
 */
export async function createGoal(goal: Partial<Goal>): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([
        {
          title: goal.title,
          description: goal.description,
          area: goal.category,
          type: goal.type,
          target_date: goal.timeframe?.endDate,
          status: goal.status || 'active',
          priority: goal.priority || 'medium',
          visualization_image_url: goal.visualizationImageUrl,
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    // Si hay pasos, crearlos
    if (goal.steps && goal.steps.length > 0 && data) {
      await createGoalSteps(data.id, goal.steps);
    }
    
    return data;
  } catch (error) {
    console.error('Error al crear meta:', error);
    return null;
  }
}

/**
 * Crea pasos para una meta
 * @param goalId ID de la meta
 * @param steps Lista de pasos
 */
export async function createGoalSteps(goalId: string, steps: string[]): Promise<void> {
  try {
    const stepsData = steps.map((step, index) => ({
      goal_id: goalId,
      title: step,
      description: '',
      status: 'pending',
      order_index: index,
      ai_generated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('goal_steps')
      .insert(stepsData);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error al crear pasos de meta:', error);
  }
}

/**
 * Actualiza una meta existente
 * @param id ID de la meta
 * @param goal Datos actualizados
 * @returns Meta actualizada
 */
export async function updateGoal(id: string, goal: Partial<Goal>): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update({
        title: goal.title,
        description: goal.description,
        area: goal.category,
        type: goal.type,
        target_date: goal.timeframe?.endDate,
        status: goal.status,
        priority: goal.priority,
        visualization_image_url: goal.visualizationImageUrl,
        progress_percentage: goal.progressPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al actualizar meta:', error);
    return null;
  }
}

/**
 * Elimina una meta (soft delete)
 * @param id ID de la meta
 * @returns true si se eliminó correctamente
 */
export async function deleteGoal(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('goals')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    return false;
  }
}

/**
 * Actualiza el progreso de una meta
 * @param id ID de la meta
 * @param progress Porcentaje de progreso (0-100)
 * @returns Meta actualizada
 */
export async function updateGoalProgress(id: string, progress: number): Promise<Goal | null> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update({
        progress_percentage: Math.min(Math.max(progress, 0), 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al actualizar progreso de meta:', error);
    return null;
  }
} 
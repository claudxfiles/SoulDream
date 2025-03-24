import { supabase } from './supabase';

/**
 * Servicio para gestionar las tareas
 */

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  related_goal_id?: string;
  category?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

/**
 * Obtiene todas las tareas del usuario
 * @returns Lista de tareas
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_deleted', false)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return [];
  }
}

/**
 * Obtiene una tarea por su ID
 * @param id ID de la tarea
 * @returns Tarea
 */
export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al obtener tarea por ID:', error);
    return null;
  }
}

/**
 * Crea una nueva tarea
 * @param task Datos de la tarea
 * @returns Tarea creada
 */
export async function createTask(task: Task): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: task.title,
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          due_date: task.due_date,
          related_goal_id: task.related_goal_id,
          category: task.category,
          tags: task.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return null;
  }
}

/**
 * Crea una tarea a partir de un paso de meta
 * @param title Título de la tarea
 * @param goalId ID de la meta relacionada
 * @returns Tarea creada
 */
export async function createTaskFromGoalStep(title: string, goalId: string): Promise<Task | null> {
  try {
    // Obtener información de la meta para contexto
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();
    
    if (goalError) throw goalError;
    
    // Crear la tarea con información de la meta
    const task: Task = {
      title,
      description: `Tarea generada a partir de la meta: ${goalData?.title || 'Meta relacionada'}`,
      status: 'pending',
      priority: goalData?.priority || 'medium',
      related_goal_id: goalId,
      category: goalData?.area || 'general',
      tags: ['meta', goalData?.area || 'general']
    };
    
    return createTask(task);
  } catch (error) {
    console.error('Error al crear tarea desde paso de meta:', error);
    return null;
  }
}

/**
 * Actualiza una tarea existente
 * @param id ID de la tarea
 * @param task Datos actualizados
 * @returns Tarea actualizada
 */
export async function updateTask(id: string, task: Partial<Task>): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        related_goal_id: task.related_goal_id,
        category: task.category,
        tags: task.tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return null;
  }
}

/**
 * Elimina una tarea (soft delete)
 * @param id ID de la tarea
 * @returns true si se eliminó correctamente
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return false;
  }
}

/**
 * Cambia el estado de una tarea
 * @param id ID de la tarea
 * @param status Nuevo estado
 * @returns Tarea actualizada
 */
export async function updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed'): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Si la tarea está relacionada con una meta y se ha completado,
    // actualizar el progreso de la meta
    if (status === 'completed' && data.related_goal_id) {
      await updateGoalProgressFromTasks(data.related_goal_id);
    }
    
    return data;
  } catch (error) {
    console.error('Error al actualizar estado de tarea:', error);
    return null;
  }
}

/**
 * Actualiza el progreso de una meta basado en las tareas completadas
 * @param goalId ID de la meta
 */
async function updateGoalProgressFromTasks(goalId: string): Promise<void> {
  try {
    // Obtener todas las tareas relacionadas con la meta
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('related_goal_id', goalId)
      .eq('is_deleted', false);
    
    if (tasksError) throw tasksError;
    
    if (!tasks || tasks.length === 0) return;
    
    // Calcular el progreso basado en tareas completadas
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    // Actualizar el progreso de la meta
    const { error: updateError } = await supabase
      .from('goals')
      .update({
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error al actualizar progreso de meta desde tareas:', error);
  }
} 
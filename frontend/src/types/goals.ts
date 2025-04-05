import { Database } from './supabase';

export type GoalArea =
  | 'Desarrollo Personal'
  | 'Salud y Bienestar'
  | 'Educación'
  | 'Finanzas'
  | 'Hobbies';

export type GoalType =
  | 'Otro'
  | 'Proyecto'
  | 'Hábito'
  | 'Aprendizaje'
  | 'Financiero';

export type GoalPriority = 'Baja' | 'Media' | 'Alta';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalProgressType = 'numeric' | 'percentage' | 'boolean';
export type GoalStepStatus = 'pending' | 'in_progress' | 'completed';

// Interfaz para datos mock existentes
export interface GoalMockData {
    id: number;
    title: string;
    description?: string;
    category: GoalArea;
    progress: number;
    targetDate?: string;
    status: GoalStatus;
}

// Interfaz para datos de Supabase
export interface Goal {
    id: string;
    title: string;
    description?: string;
    area: GoalArea;
    target_date?: string;
    target_value?: number;
    current_value?: number;
    status: GoalStatus;
    progress_type: GoalProgressType;
    type: GoalType;
    priority: GoalPriority;
    image_url?: string;
    user_id: string;
    start_date?: string;
    created_at: string;
    updated_at: string;
}

export interface GoalUpdate {
    id: string;
    goal_id: string;
    previous_value: number;
    new_value: number;
    note: string | null;
    created_at: string;
}

export interface GoalSubtask {
    id: string;
    goal_id: string;
    title: string;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface GoalStep {
    id: string;
    title: string;
    description?: string;
    status: GoalStepStatus;
    due_date?: string;
    ai_generated: boolean;
    goal_id: string;
    orderindex?: number;
    created_at: string;
    updated_at: string;
}

export interface GoalWithSteps extends Goal {
    steps: GoalStep[];
}

// Tipos para crear/actualizar
export type CreateGoalInput = Omit<Goal, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGoalInput = Partial<CreateGoalInput>;
export type CreateGoalStepInput = Omit<GoalStep, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGoalStepInput = Partial<CreateGoalStepInput>;

// Tipo para el progreso calculado de una meta
export interface GoalProgress {
    percentage: number;
    currentValue: number;
    targetValue: number | null;
    isCompleted: boolean;
}

// Tipo para estadísticas de metas
export interface GoalStats {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
} 
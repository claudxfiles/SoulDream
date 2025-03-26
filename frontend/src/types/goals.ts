import { Database } from './supabase';

export type GoalProgressType = 'numeric' | 'percentage' | 'boolean';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalCategory = 'Desarrollo Personal' | 'Salud y Bienestar' | 'Educación' | 'Finanzas' | 'Hobbies';

// Interfaz para datos mock existentes
export interface GoalMockData {
    id: number;
    title: string;
    description?: string;
    category: GoalCategory;
    progress: number;
    targetDate?: string;
    status: GoalStatus;
}

// Interfaz para datos de Supabase
export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category: GoalCategory;
    target_value: number | null;
    current_value: number;
    start_date: string;
    target_date: string | null;
    status: GoalStatus;
    progress_type: GoalProgressType;
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

// Tipos para crear/actualizar metas
export type CreateGoalInput = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateGoalInput = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

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
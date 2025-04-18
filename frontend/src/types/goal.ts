export type GoalType = 'Desarrollo_Personal' | 'Salud_Bienestar' | 'Educacion' | 'Finanzas' | 'Hobbies';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  user_id: string;
  created_at?: string;
  updated_at?: string;
  steps?: {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
  }[];
}

export interface GoalStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  aiGenerated: boolean;
  goalId?: string;
  orderIndex?: number;
}

export interface GoalWithSteps extends Omit<Goal, 'steps'> {
  steps: GoalStep[];
}

export interface GoalMetadata {
  area: string;
  goalType: string;
  confidence: number;
  title?: string;
  steps?: string[];
  timeframe?: {
    startDate: Date | string;
    endDate: Date | string;
    durationDays: number;
  };
} 
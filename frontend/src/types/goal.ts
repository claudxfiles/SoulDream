export interface Goal {
  id?: string;
  title: string;
  description: string;
  category: string;
  timeframe?: {
    startDate: Date | string;
    endDate: Date | string;
    durationDays?: number;
  };
  progressPercentage?: number;
  status: 'active' | 'completed' | 'abandoned';
  steps?: string[];
  priority: 'low' | 'medium' | 'high';
  visualizationImageUrl?: string;
  type: string;
  userId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
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
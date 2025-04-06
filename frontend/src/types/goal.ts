export interface Goal {
  id?: string;
  title: string;
  description: string;
  type: 'financial' | 'health' | 'career' | 'personal' | 'other';
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  steps?: string[];
  tasks?: {
    id: string;
    title: string;
    description: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  }[];
  milestones?: {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    achieved: boolean;
  }[];
  metrics?: {
    id: string;
    name: string;
    value: number;
    unit: string;
    targetValue: number;
    currentValue: number;
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
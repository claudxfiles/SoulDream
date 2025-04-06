export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'receiving' | 'error';
  metadata?: any;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  area: 'Desarrollo Personal' | 'Salud y Bienestar' | 'Educación' | 'Finanzas' | 'Hobbies';
  type: 'Corto Plazo' | 'Mediano Plazo' | 'Largo Plazo';
  targetDate?: Date;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  progress: number;
  steps?: GoalStep[];
  resources?: Resource[];
  metrics?: Metric[];
  notes?: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  stepNumber: number;
  description: string;
  estimatedDuration?: string;
  resources?: Resource[];
  completionCriteria?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  completedAt?: Date;
}

export interface Resource {
  id: string;
  type: 'link' | 'video' | 'document' | 'other';
  title: string;
  url: string;
  description?: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
} 
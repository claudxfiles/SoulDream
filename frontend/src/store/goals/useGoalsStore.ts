import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type GoalCategory = 'personal_development' | 'health_wellness' | 'education' | 'finance' | 'hobbies';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: Date;
  progressPercentage: number;
  status: 'active' | 'completed' | 'abandoned';
  createdAt?: Date;
  updatedAt?: Date;
  parentGoalId?: string;
  priority: 'low' | 'medium' | 'high';
  visualizationImageUrl?: string;
  type: 'acquisition' | 'learning' | 'habit' | 'other';
}

export interface SubGoal extends Omit<Goal, 'parentGoalId'> {
  parentGoalId: string;
}

export interface GoalStep {
  id: string;
  goalId: string;
  title: string;
  description: string;
  orderIndex: number;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
}

interface GoalsState {
  goals: Goal[];
  subGoals: SubGoal[];
  goalSteps: GoalStep[];
  selectedGoal: Goal | null;
  loading: boolean;
  error: string | null;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setSelectedGoal: (goal: Goal | null) => void;
  addSubGoal: (subGoal: Omit<SubGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addGoalStep: (goalStep: Omit<GoalStep, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoalStep: (id: string, updates: Partial<GoalStep>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGoalsStore = create<GoalsState>()(
  devtools(
    persist(
      (set) => ({
        goals: [],
        subGoals: [],
        goalSteps: [],
        selectedGoal: null,
        loading: false,
        error: null,
        setGoals: (goals) => set({ goals }),
        addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
        updateGoal: (id, updates) =>
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === id ? { ...goal, ...updates } : goal
            ),
          })),
        deleteGoal: (id) =>
          set((state) => ({
            goals: state.goals.filter((goal) => goal.id !== id),
            subGoals: state.subGoals.filter((subGoal) => subGoal.parentGoalId !== id),
            goalSteps: state.goalSteps.filter((step) => step.goalId !== id),
          })),
        setSelectedGoal: (goal) => set({ selectedGoal: goal }),
        addSubGoal: (subGoal) =>
          set((state) => ({
            subGoals: [
              ...state.subGoals,
              {
                ...subGoal,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          })),
        addGoalStep: (goalStep) =>
          set((state) => ({
            goalSteps: [
              ...state.goalSteps,
              {
                ...goalStep,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          })),
        updateGoalStep: (id, updates) =>
          set((state) => ({
            goalSteps: state.goalSteps.map((step) =>
              step.id === id ? { ...step, ...updates, updatedAt: new Date() } : step
            ),
          })),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'goals-storage',
      }
    )
  )
); 
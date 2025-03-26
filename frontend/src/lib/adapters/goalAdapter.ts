import { Goal, GoalMockData, GoalProgress } from '@/types/goals';

export class GoalAdapter {
    static toMockFormat(goal: Goal): GoalMockData {
        return {
            id: parseInt(goal.id), // Convertir UUID a número para compatibilidad
            title: goal.title,
            description: goal.description || undefined,
            category: goal.category,
            progress: this.calculateProgress(goal),
            targetDate: goal.target_date || undefined,
            status: goal.status
        };
    }

    static fromMockFormat(mockGoal: GoalMockData): Partial<Goal> {
        return {
            title: mockGoal.title,
            description: mockGoal.description || null,
            category: mockGoal.category,
            target_value: 100, // Por defecto usamos 100 para porcentajes
            current_value: mockGoal.progress,
            target_date: mockGoal.targetDate || null,
            status: mockGoal.status,
            progress_type: 'percentage' // Por defecto usamos porcentaje
        };
    }

    static calculateProgress(goal: Goal): number {
        switch (goal.progress_type) {
            case 'percentage':
                return goal.current_value;
            case 'numeric':
                if (!goal.target_value) return 0;
                return (goal.current_value / goal.target_value) * 100;
            case 'boolean':
                return goal.current_value > 0 ? 100 : 0;
            default:
                return 0;
        }
    }

    static getProgressDetails(goal: Goal): GoalProgress {
        const percentage = this.calculateProgress(goal);
        return {
            percentage,
            currentValue: goal.current_value,
            targetValue: goal.target_value,
            isCompleted: goal.status === 'completed' || percentage >= 100
        };
    }

    static toMockFormatList(goals: Goal[]): GoalMockData[] {
        return goals.map(goal => this.toMockFormat(goal));
    }
} 
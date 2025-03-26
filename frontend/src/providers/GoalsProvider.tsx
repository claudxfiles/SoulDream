import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useDataSourceStore } from '@/store/dataSourceStore';
import { mockGoals } from '@/data/mockData';
import { GoalService } from '@/lib/services/goalService';
import { GoalAdapter } from '@/lib/adapters/goalAdapter';
import { Goal, GoalMockData, GoalStats, GoalSubtask } from '@/types/goals';

interface GoalsContextType {
    goals: GoalMockData[];
    isLoading: boolean;
    error: Error | null;
    stats: GoalStats;
    selectedGoal: Goal | null;
    subtasks: GoalSubtask[];
    refetch: () => Promise<void>;
    selectGoal: (id: number | string) => Promise<void>;
    createGoal: (goal: Omit<GoalMockData, 'id'>) => Promise<void>;
    updateGoal: (id: number | string, updates: Partial<GoalMockData>) => Promise<void>;
    deleteGoal: (id: number | string) => Promise<void>;
    updateProgress: (id: number | string, progress: number) => Promise<void>;
    addSubtask: (title: string) => Promise<void>;
    toggleSubtask: (subtaskId: string) => Promise<void>;
    deleteSubtask: (subtaskId: string) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
    const { useRealData, moduleConfig } = useDataSourceStore();
    const shouldUseRealData = useRealData && moduleConfig.goals;

    const [goals, setGoals] = useState<GoalMockData[]>(mockGoals);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [stats, setStats] = useState<GoalStats>({
        total: 0,
        completed: 0,
        inProgress: 0,
        completionRate: 0
    });
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [subtasks, setSubtasks] = useState<GoalSubtask[]>([]);

    const fetchGoals = async () => {
        if (!shouldUseRealData) {
            setGoals(mockGoals);
            // Calcular estadísticas de datos mock
            const total = mockGoals.length;
            const completed = mockGoals.filter((g: GoalMockData) => g.status === 'completed').length;
            setStats({
                total,
                completed,
                inProgress: total - completed,
                completionRate: total > 0 ? (completed / total) * 100 : 0
            });
            return;
        }

        setIsLoading(true);
        try {
            const [apiGoals, apiStats] = await Promise.all([
                GoalService.getGoals(),
                GoalService.getGoalStats()
            ]);
            setGoals(GoalAdapter.toMockFormatList(apiGoals));
            setStats(apiStats);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error desconocido'));
        } finally {
            setIsLoading(false);
        }
    };

    const selectGoal = async (id: number | string) => {
        if (!shouldUseRealData) {
            const goal = mockGoals.find((g: GoalMockData) => g.id === id);
            if (goal) {
                setSelectedGoal(GoalAdapter.fromMockFormat(goal) as Goal);
                setSubtasks([]); // No hay subtareas en datos mock
            }
            return;
        }

        try {
            const [goal, subtasks] = await Promise.all([
                GoalService.getGoalById(id.toString()),
                GoalService.getGoalSubtasks(id.toString())
            ]);
            setSelectedGoal(goal);
            setSubtasks(subtasks);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al cargar meta'));
        }
    };

    const createGoal = async (goal: Omit<GoalMockData, 'id'>) => {
        if (!shouldUseRealData) {
            const newGoal = {
                ...goal,
                id: Math.max(...mockGoals.map(g => g.id)) + 1
            };
            setGoals([newGoal, ...mockGoals]);
            return;
        }

        try {
            const apiGoal = await GoalService.createGoal(GoalAdapter.fromMockFormat(goal as GoalMockData) as any);
            setGoals(prev => [GoalAdapter.toMockFormat(apiGoal), ...prev]);
            await fetchGoals(); // Actualizar estadísticas
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al crear meta'));
            throw err;
        }
    };

    const updateGoal = async (id: number | string, updates: Partial<GoalMockData>) => {
        if (!shouldUseRealData) {
            setGoals(prev => prev.map((g: GoalMockData) => 
                g.id === id ? { ...g, ...updates } : g
            ));
            return;
        }

        try {
            const apiUpdates = GoalAdapter.fromMockFormat(updates as GoalMockData);
            const updatedGoal = await GoalService.updateGoal(id.toString(), apiUpdates);
            setGoals(prev => prev.map(g => 
                g.id === parseInt(updatedGoal.id) 
                    ? GoalAdapter.toMockFormat(updatedGoal) 
                    : g
            ));
            await fetchGoals(); // Actualizar estadísticas
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al actualizar meta'));
            throw err;
        }
    };

    const deleteGoal = async (id: number | string) => {
        if (!shouldUseRealData) {
            setGoals(prev => prev.filter(g => g.id !== id));
            return;
        }

        try {
            await GoalService.deleteGoal(id.toString());
            setGoals(prev => prev.filter(g => g.id !== parseInt(id.toString())));
            await fetchGoals(); // Actualizar estadísticas
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al eliminar meta'));
            throw err;
        }
    };

    const updateProgress = async (id: number | string, progress: number) => {
        if (!shouldUseRealData) {
            await updateGoal(id, { progress });
            return;
        }

        try {
            const goal = await GoalService.getGoalById(id.toString());
            if (!goal) throw new Error('Meta no encontrada');

            const previousValue = goal.current_value;
            await Promise.all([
                GoalService.updateGoal(id.toString(), { current_value: progress }),
                GoalService.addGoalUpdate(id.toString(), previousValue, progress)
            ]);
            await fetchGoals();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al actualizar progreso'));
            throw err;
        }
    };

    const addSubtask = async (title: string) => {
        if (!selectedGoal || !shouldUseRealData) return;

        try {
            const newSubtask = await GoalService.addSubtask(selectedGoal.id, title);
            setSubtasks(prev => [...prev, newSubtask]);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al añadir subtarea'));
            throw err;
        }
    };

    const toggleSubtask = async (subtaskId: string) => {
        if (!shouldUseRealData) return;

        try {
            const subtask = subtasks.find(s => s.id === subtaskId);
            if (!subtask) return;

            const updatedSubtask = await GoalService.updateSubtask(subtaskId, {
                completed: !subtask.completed
            });
            setSubtasks(prev => prev.map(s => 
                s.id === subtaskId ? updatedSubtask : s
            ));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al actualizar subtarea'));
            throw err;
        }
    };

    const deleteSubtask = async (subtaskId: string) => {
        if (!shouldUseRealData) return;

        try {
            await GoalService.deleteSubtask(subtaskId);
            setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Error al eliminar subtarea'));
            throw err;
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [shouldUseRealData]);

    return (
        <GoalsContext.Provider value={{
            goals,
            isLoading,
            error,
            stats,
            selectedGoal,
            subtasks,
            refetch: fetchGoals,
            selectGoal,
            createGoal,
            updateGoal,
            deleteGoal,
            updateProgress,
            addSubtask,
            toggleSubtask,
            deleteSubtask
        }}>
            {children}
        </GoalsContext.Provider>
    );
}

export const useGoals = () => {
    const context = useContext(GoalsContext);
    if (context === undefined) {
        throw new Error('useGoals debe usarse dentro de un GoalsProvider');
    }
    return context;
}; 
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { 
  getHabits, 
  getHabit, 
  createHabit, 
  updateHabit, 
  deleteHabit, 
  getHabitLogs, 
  markHabitAsCompleted,
  calculateHabitStatistics
} from '@/lib/habits';
import { Habit, HabitCreate, HabitUpdate, HabitWithLogsAndProgress } from '@/types/habit';
import { useState, useCallback, useEffect } from 'react';
import { habitService } from '@/services/habitService';
import { HabitLog, HabitLogCreate } from '@/types/habit';

export const useHabits = (category?: string) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);

  // Obtener todos los hábitos con optimizaciones
  const { data: allHabits, isLoading, error, refetch } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const habits = await habitService.getHabits();
      const today = new Date().toISOString().split('T')[0];
      
      // Obtener los logs de hoy en paralelo para todos los hábitos
      const todayLogs = await Promise.all(
        habits.map(habit => 
          habitService.getHabitLogs(habit.id)
            .then(logs => ({
              habitId: habit.id,
              isCompletedToday: logs.some(log => log.completed_date.split('T')[0] === today)
            }))
            .catch(() => ({ habitId: habit.id, isCompletedToday: false }))
        )
      );
      
      // Crear un mapa para acceso rápido
      const completionMap = new Map(
        todayLogs.map(({ habitId, isCompletedToday }) => [habitId, isCompletedToday])
      );
      
      // Mapear los hábitos con su estado de completado
      return habits.map(habit => ({
        ...habit,
        isCompletedToday: completionMap.get(habit.id) || false
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,   // Garbage collection después de 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Filtrar por categoría si es necesario
  const habits = allHabits && selectedCategory && selectedCategory !== 'all'
    ? allHabits.filter((habit: Habit) => habit.category === selectedCategory)
    : allHabits;
  
  // Mutación para crear un hábito con optimistic updates
  const createHabitMutation = useMutation({
    mutationFn: (habit: HabitCreate) => habitService.createHabit(habit),
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      // Optimistic update
      const optimisticHabit = {
        id: 'temp-' + Date.now(),
        ...newHabit,
        created_at: new Date().toISOString(),
        isCompletedToday: false
      };
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => 
        old ? [...old, optimisticHabit] : [optimisticHabit]
      );
      
      return { previousHabits };
    },
    onError: (err, newHabit, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });
  
  // Mutación para actualizar un hábito con optimistic updates
  const updateHabitMutation = useMutation({
    mutationFn: ({ id, ...rest }: HabitUpdate & { id: string }) => 
      habitService.updateHabit({ id, ...rest }),
    onMutate: async (updatedHabit) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => {
        if (!old) return [updatedHabit];
        return old.map(habit => 
          habit.id === updatedHabit.id ? { ...habit, ...updatedHabit } : habit
        );
      });
      
      return { previousHabits };
    },
    onError: (err, updatedHabit, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });
  
  // Mutación para eliminar un hábito con optimistic updates
  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => {
        if (!old) return [];
        return old.filter(habit => habit.id !== habitId);
      });
      
      return { previousHabits };
    },
    onError: (err, habitId, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });
  
  // Mutación para marcar un hábito como completado con optimistic updates
  const completeHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: string }) => {
      const response = await habitService.logHabit({
        habit_id: habitId,
        completed_date: new Date().toISOString(),
      });
      return { habitId, response };
    },
    onMutate: async ({ habitId }) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => {
        if (!old) return [];
        return old.map(habit => 
          habit.id === habitId ? { ...habit, isCompletedToday: true } : habit
        );
      });
      
      return { previousHabits };
    },
    onError: (err, { habitId }, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });
  
  // Función para cambiar la categoría seleccionada
  const changeCategory = useCallback((newCategory?: string) => {
    setSelectedCategory(newCategory);
  }, []);
  
  return {
    habits,
    isLoading,
    error,
    refetch,
    createHabit: createHabitMutation.mutate,
    updateHabit: updateHabitMutation.mutate,
    deleteHabit: deleteHabitMutation.mutate,
    completeHabit: completeHabitMutation.mutate,
    changeCategory,
    selectedCategory
  };
};

export const useHabitDetails = (habitId: string) => {
  const queryClient = useQueryClient();
  
  // Obtener un hábito específico
  const { data: habit, isLoading: isLoadingHabit } = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabit(habitId),
    enabled: !!habitId,
  });
  
  // Obtener los registros de un hábito
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['habitLogs', habitId],
    queryFn: () => getHabitLogs(habitId),
    enabled: !!habitId,
  });
  
  // Calcular estadísticas si tenemos tanto el hábito como los registros
  const habitWithStats: HabitWithLogsAndProgress | undefined = 
    habit && logs 
      ? calculateHabitStatistics([habit]) 
      : undefined;
  
  // Mutación para marcar un hábito como completado
  const completeHabitMutation = useMutation({
    mutationFn: ({ 
      notes, 
      rating 
    }: { 
      notes?: string; 
      rating?: number 
    }) => markHabitAsCompleted(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habitLogs', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
  
  return {
    habit: habitWithStats,
    logs,
    isLoading: isLoadingHabit || isLoadingLogs,
    completeHabit: completeHabitMutation.mutate,
    isCompleting: completeHabitMutation.isPending,
  };
};

// Hook para obtener un hábito específico por ID
export const useGetHabitById = (habitId: string) => {
  return useQuery({
    queryKey: ['habits', habitId],
    queryFn: () => habitService.getHabitById(habitId),
    enabled: !!habitId,
  });
};

// Hook para obtener los logs de un hábito
export const useGetHabitLogs = (habitId: string) => {
  return useQuery({
    queryKey: ['habitLogs', habitId],
    queryFn: () => habitService.getHabitLogs(habitId),
    enabled: !!habitId,
  });
};

// Hook para crear un nuevo hábito
export const useCreateHabit = (options?: any) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newHabit: HabitCreate) => habitService.createHabit(newHabit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      if (options?.onSuccess) options.onSuccess();
    },
  });
};

// Hook para actualizar un hábito existente
export const useUpdateHabit = (options?: any) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: HabitUpdate & { id: string }) => {
      try {
        const response = await habitService.updateHabit(updateData);
        return response;
      } catch (error: any) {
        throw new Error(error.response?.data?.detail || 'Error al actualizar el hábito');
      }
    },
    onSuccess: (data, variables) => {
      // Actualizar inmediatamente el caché del hábito individual
      queryClient.setQueryData(['habits', variables.id], data);
      
      // Actualizar inmediatamente la lista de hábitos
      queryClient.setQueryData(['habits'], (oldData: Habit[] | undefined) => {
        if (!oldData) return [data];
        return oldData.map(habit => 
          habit.id === data.id ? { ...data, isCompletedToday: habit.isCompletedToday } : habit
        );
      });
      
      // Invalidar las queries para asegurar la consistencia
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits', variables.id] });
      
      // Llamar al callback de éxito si existe
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};

// Hook para eliminar un hábito
export const useDeleteHabit = (options?: any) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => habitService.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      if (options?.onSuccess) options.onSuccess();
    },
  });
};

// Hook para registrar un nuevo log de hábito
export const useLogHabit = (options?: any) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (logData: HabitLogCreate) => habitService.logHabit(logData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitLogs', data.habit_id] });
      if (options?.onSuccess) options.onSuccess(data);
    },
  });
};

// Hook para eliminar un log de hábito
export const useDeleteHabitLog = (options?: any) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({habitId, logId}: {habitId: string, logId: string}) => habitService.deleteHabitLog(logId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habitLogs', variables.habitId] });
      if (options?.onSuccess) options.onSuccess();
    },
  });
}; 
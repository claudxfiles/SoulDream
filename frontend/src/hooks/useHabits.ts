import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getHabit, 
  getHabitLogs,
  markHabitAsCompleted,
  calculateHabitStatistics
} from '@/lib/habits';
import { Habit, HabitCreate, HabitUpdate, HabitWithLogsAndProgress } from '@/types/habit';
import { useState, useCallback } from 'react';
import { habitService } from '@/services/habitService';
import { HabitLog, HabitLogCreate } from '@/types/habit';

export const useHabits = (category?: string) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(category);

  // Obtener todos los hábitos
  const { data: allHabits, isLoading: isLoadingHabits, error: habitsError, refetch: refetchHabits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitService.getHabits(),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000,   // Garbage collection después de 10 minutos
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Obtener los logs de hoy en una sola consulta
  const { data: todayLogs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['habits', 'todayLogs'],
    queryFn: () => habitService.getTodayHabitLogs(),
    enabled: !!allHabits,
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
    gcTime: 5 * 60 * 1000,    // Garbage collection después de 5 minutos
  });

  // Combinar hábitos con sus logs
  const habits = allHabits && todayLogs ? allHabits.map(habit => ({
    ...habit,
    isCompletedToday: todayLogs.some((log: { habit_id: string; completed: boolean }) => 
      log.habit_id === habit.id && log.completed
    )
  })) : [];

  // Filtrar por categoría si es necesario
  const filteredHabits = selectedCategory && selectedCategory !== 'all'
    ? habits.filter((habit: Habit) => habit.category === selectedCategory)
    : habits;
  
  // Mutación para crear un hábito con optimistic updates
  const createHabitMutation = useMutation({
    mutationFn: (habit: HabitCreate) => habitService.createHabit(habit),
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      // Optimistic update
      const tempId = 'temp-' + Date.now();
      const optimisticHabit = {
        id: tempId,
        ...newHabit,
        created_at: new Date().toISOString(),
        isCompletedToday: false
      };
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => 
        old ? [...old, optimisticHabit] : [optimisticHabit]
      );
      
      return { previousHabits, tempId };
    },
    onSuccess: (createdHabit, _, context) => {
      if (context?.tempId) {
        // Actualizar el hábito temporal con el real
        queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => {
          if (!old) return [createdHabit];
          return old.map(habit => 
            habit.id === context.tempId ? { ...createdHabit, isCompletedToday: false } : habit
          );
        });
      }
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
  
  // Mutación para reiniciar todos los hábitos
  const resetHabitsMutation = useMutation({
    mutationFn: async () => {
      const response = await habitService.resetHabits();
      return response;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      
      queryClient.setQueryData(['habits'], (old: Habit[] | undefined) => {
        if (!old) return [];
        return old.map(habit => ({ ...habit, isCompletedToday: false }));
      });
      
      return { previousHabits };
    },
    onError: (err, _, context) => {
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

  // Función para refrescar todos los datos
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchHabits(),
      refetchLogs()
    ]);
  }, [refetchHabits, refetchLogs]);

  return {
    habits: filteredHabits,
    isLoading: isLoadingHabits || isLoadingLogs,
    error: habitsError,
    refetch,
    createHabit: createHabitMutation.mutate,
    updateHabit: updateHabitMutation.mutate,
    deleteHabit: deleteHabitMutation.mutate,
    completeHabit: completeHabitMutation.mutate,
    resetHabits: resetHabitsMutation.mutate,
    changeCategory,
    selectedCategory
  };
};

export const useHabitDetails = (habitId: string) => {
  const queryClient = useQueryClient();
  const isTemporary = habitId.startsWith('temp-');
  
  // Obtener un hábito específico
  const { data: habit, isLoading: isLoadingHabit } = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => {
      if (isTemporary) {
        const habits = queryClient.getQueryData<Habit[]>(['habits']);
        const tempHabit = habits?.find(h => h.id === habitId);
        if (tempHabit) {
          return tempHabit;
        }
        throw new Error('Hábito temporal no encontrado');
      }
      return habitService.getHabitById(habitId);
    },
    enabled: !!habitId,
  });
  
  // Obtener los registros de un hábito solo si no es temporal
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['habitLogs', habitId],
    queryFn: () => habitService.getHabitLogs(habitId),
    enabled: !!habitId && !isTemporary, // Solo ejecutar si el hábito no es temporal
  });
  
  // Calcular estadísticas si tenemos el hábito
  const habitWithStats: HabitWithLogsAndProgress | undefined = 
    habit ? calculateHabitStatistics([habit]) : undefined;
  
  // Mutación para marcar un hábito como completado
  const completeHabitMutation = useMutation({
    mutationFn: ({ 
      notes, 
      rating 
    }: { 
      notes?: string; 
      rating?: number 
    }) => habitService.logHabit({
      habit_id: habitId,
      completed_date: new Date().toISOString(),
      notes,
      quality_rating: rating
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habitLogs', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
  
  return {
    habit: habitWithStats,
    logs,
    isLoading: isLoadingHabit || (!isTemporary && isLoadingLogs),
    completeHabit: completeHabitMutation.mutate,
    isCompleting: completeHabitMutation.isPending,
  };
};

// Hook para obtener un hábito específico por ID
export const useGetHabitById = (habitId: string) => {
  const queryClient = useQueryClient();
  const isTemporary = habitId.startsWith('temp-');
  
  // Obtener un hábito específico
  const { data: habit, isLoading: isLoadingHabit } = useQuery({
    queryKey: ['habit', habitId],
    queryFn: async () => {
      // Si el ID es temporal, buscar en el caché de hábitos
      if (isTemporary) {
        const habits = queryClient.getQueryData<Habit[]>(['habits']);
        const tempHabit = habits?.find(h => h.id === habitId);
        if (tempHabit) {
          return tempHabit;
        }
        throw new Error('Hábito temporal no encontrado');
      }
      
      // Intentar obtener del caché primero
      const cachedHabit = queryClient.getQueryData<Habit>(['habit', habitId]);
      if (cachedHabit) {
        return cachedHabit;
      }
      
      // Si no está en caché, hacer la petición
      return habitService.getHabitById(habitId);
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    enabled: !!habitId,
    retry: false,
  });
  
  // Obtener los registros de un hábito solo si no es temporal
  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['habitLogs', habitId],
    queryFn: () => {
      if (isTemporary) {
        return Promise.resolve([]);
      }
      
      // Intentar obtener del caché primero
      const cachedLogs = queryClient.getQueryData<HabitLog[]>(['habitLogs', habitId]);
      if (cachedLogs) {
        return cachedLogs;
      }
      
      return habitService.getHabitLogs(habitId);
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    enabled: !!habitId && !isTemporary,
  });
  
  // Calcular estadísticas si tenemos el hábito
  const habitWithStats: HabitWithLogsAndProgress | undefined = 
    habit ? calculateHabitStatistics([habit]) : undefined;
  
  return {
    habit: habitWithStats,
    logs,
    isLoading: isLoadingHabit || (!isTemporary && isLoadingLogs),
    isCompleting: false,
  };
};

// Hook para obtener los logs de un hábito
export const useGetHabitLogs = (habitId: string) => {
  const isTemporary = habitId.startsWith('temp-');
  
  return useQuery({
    queryKey: ['habitLogs', habitId],
    queryFn: () => {
      if (isTemporary) {
        return Promise.resolve([]); // Retornar array vacío para hábitos temporales
      }
      return habitService.getHabitLogs(habitId);
    },
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
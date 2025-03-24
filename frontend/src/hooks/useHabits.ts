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
  
  // Obtener todos los hábitos
  const { data: allHabits, isLoading, error, refetch } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const habits = await habitService.getHabits();
      
      // Verificar si cada hábito ha sido completado hoy
      const habitsWithStatus = await Promise.all(
        habits.map(async (habit) => {
          try {
            const logs = await habitService.getHabitLogs(habit.id);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            const isCompletedToday = logs.some(log => 
              log.completed_date.split('T')[0] === today
            );
            
            return {
              ...habit,
              isCompletedToday
            };
          } catch (error) {
            console.error(`Error al verificar estado del hábito ${habit.id}:`, error);
            return {
              ...habit,
              isCompletedToday: false
            };
          }
        })
      );
      
      return habitsWithStatus;
    },
    staleTime: 5000, // Aumentar tiempo de caché para prevenir múltiples cargas innecesarias
  });
  
  // Filtrar por categoría si es necesario
  const habits = allHabits && selectedCategory && selectedCategory !== 'all'
    ? allHabits.filter(habit => habit.category === selectedCategory)
    : allHabits;
  
  // Mutación para crear un hábito
  const createHabitMutation = useMutation({
    mutationFn: (habit: HabitCreate) => habitService.createHabit(habit),
    onSuccess: (newHabit) => {
      // Actualizar la caché directamente con el nuevo hábito creado
      queryClient.setQueryData(['habits'], (oldData: Habit[] | undefined) => {
        const today = new Date().toISOString().split('T')[0];
        const newHabitWithStatus = {
          ...newHabit,
          isCompletedToday: false
        };
        
        // Si ya existen datos, añadir el nuevo hábito
        if (oldData) {
          return [...oldData, newHabitWithStatus];
        }
        
        // Si no hay datos, crear un nuevo array con el hábito creado
        return [newHabitWithStatus];
      });
      
      // Invalidar la caché para futuras consultas
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error) => {
      console.error('Error al crear hábito en mutation:', error);
    }
  });
  
  // Mutación para actualizar un hábito
  const updateHabitMutation = useMutation({
    mutationFn: ({ id, ...rest }: HabitUpdate & { id: string }) => 
      habitService.updateHabit({ id, ...rest }),
    onSuccess: (updatedHabit) => {
      // Actualizar la caché directamente
      queryClient.setQueryData(['habits'], (oldData: Habit[] | undefined) => {
        if (!oldData) return [updatedHabit];
        
        return oldData.map(habit => 
          habit.id === updatedHabit.id ? { ...updatedHabit, isCompletedToday: habit.isCompletedToday } : habit
        );
      });
      
      // Invalidar la caché para futuras consultas
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
  
  // Mutación para eliminar un hábito
  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => habitService.deleteHabit(habitId),
    onSuccess: (_, habitId) => {
      // Actualizar la caché directamente eliminando el hábito
      queryClient.setQueryData(['habits'], (oldData: Habit[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(habit => habit.id !== habitId);
      });
      
      // Invalidar la caché para futuras consultas
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
  
  // Mutación para marcar un hábito como completado
  const completeHabitMutation = useMutation({
    mutationFn: ({ habitId, notes, rating }: { habitId: string; notes?: string; rating?: number }) => 
      habitService.logHabit({
        habit_id: habitId,
        completed_date: new Date().toISOString(),
        notes,
        quality_rating: rating
      }),
    onSuccess: (newLog, { habitId }) => {
      // Actualizar la caché directamente marcando el hábito como completado
      queryClient.setQueryData(['habits'], (oldData: Habit[] | undefined) => {
        if (!oldData) return [];
        
        return oldData.map(habit => 
          habit.id === habitId ? { ...habit, isCompletedToday: true } : habit
        );
      });
      
      // Invalidar las cachés relacionadas
      queryClient.invalidateQueries({ queryKey: ['habitLogs', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
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
    isCreating: createHabitMutation.isPending,
    isUpdating: updateHabitMutation.isPending,
    isDeleting: deleteHabitMutation.isPending,
    isCompleting: completeHabitMutation.isPending,
    selectedCategory,
    changeCategory,
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
    mutationFn: (updateData: HabitUpdate & { id: string }) => 
      habitService.updateHabit(updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      if (options?.onSuccess) options.onSuccess();
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
import { 
  Habit, 
  HabitCreate, 
  HabitUpdate, 
  HabitLog, 
  HabitLogCreate 
} from '@/types/habit';
import { apiClient } from './api-client';
import { format, isToday, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';

// Obtener todos los hábitos del usuario
export const getHabits = async (category?: string): Promise<Habit[]> => {
  const params = category ? { category } : {};
  
  if (process.env.NODE_ENV === 'production') {
    // En producción, usamos URL absoluta con HTTPS
    const secureUrl = 'https://api.presentandflow.cl/api/v1/habits/';
    console.log('Usando URL HTTPS directa para getHabits:', secureUrl);
    
    const response = await apiClient.get<Habit[]>(secureUrl, { params });
    return response.data;
  } else {
    // En desarrollo, usamos la ruta relativa
    const response = await apiClient.get<Habit[]>('/api/v1/habits/', { params });
    return response.data;
  }
};

// Obtener un hábito específico
export const getHabit = async (habitId: string): Promise<Habit> => {
  // Log para diagnóstico
  console.log('getHabit URL:', `/api/v1/habits/${habitId}/`);
  
  if (process.env.NODE_ENV === 'production') {
    // En producción, usamos URL absoluta con HTTPS
    const secureUrl = `https://api.presentandflow.cl/api/v1/habits/${habitId}/`;
    console.log('Usando URL HTTPS directa:', secureUrl);
    
    const response = await apiClient.get<Habit>(secureUrl);
    return response.data;
  } else {
    // En desarrollo, usamos la ruta relativa
    const response = await apiClient.get<Habit>(`/api/v1/habits/${habitId}/`);
    return response.data;
  }
};

// Crear un nuevo hábito
export const createHabit = async (habit: HabitCreate): Promise<Habit> => {
  if (process.env.NODE_ENV === 'production') {
    const secureUrl = 'https://api.presentandflow.cl/api/v1/habits/';
    console.log('Usando URL HTTPS para createHabit:', secureUrl);
    const response = await apiClient.post<Habit>(secureUrl, habit);
    return response.data;
  } else {
    const response = await apiClient.post<Habit>('/api/v1/habits/', habit);
    return response.data;
  }
};

// Actualizar un hábito existente
export const updateHabit = async (habitId: string, habit: HabitUpdate): Promise<Habit> => {
  if (process.env.NODE_ENV === 'production') {
    const secureUrl = `https://api.presentandflow.cl/api/v1/habits/${habitId}/`;
    console.log('Usando URL HTTPS para updateHabit:', secureUrl);
    const response = await apiClient.put<Habit>(secureUrl, habit);
    return response.data;
  } else {
    const response = await apiClient.put<Habit>(`/api/v1/habits/${habitId}/`, habit);
    return response.data;
  }
};

// Eliminar un hábito
export const deleteHabit = async (habitId: string): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    const secureUrl = `https://api.presentandflow.cl/api/v1/habits/${habitId}/`;
    console.log('Usando URL HTTPS para deleteHabit:', secureUrl);
    await apiClient.delete(secureUrl);
  } else {
    await apiClient.delete(`/api/v1/habits/${habitId}/`);
  }
};

// Obtener los registros de un hábito
export const getHabitLogs = async (
  habitId: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<HabitLog[]> => {
  const params: Record<string, string> = {};
  
  if (startDate) {
    params.start_date = format(startDate, 'yyyy-MM-dd');
  }
  
  if (endDate) {
    params.end_date = format(endDate, 'yyyy-MM-dd');
  }
  
  if (process.env.NODE_ENV === 'production') {
    const secureUrl = `https://api.presentandflow.cl/api/v1/habits/${habitId}/logs/`;
    console.log('Usando URL HTTPS para getHabitLogs:', secureUrl);
    const response = await apiClient.get<HabitLog[]>(secureUrl, { params });
    return response.data;
  } else {
    const response = await apiClient.get<HabitLog[]>(`/api/v1/habits/${habitId}/logs/`, { params });
    return response.data;
  }
};

// Registrar completitud de un hábito
export const logHabitCompletion = async (
  habitId: string, 
  logData: Omit<HabitLogCreate, 'habit_id'>
): Promise<HabitLog> => {
  const data: HabitLogCreate = {
    ...logData,
    habit_id: habitId
  };
  
  if (process.env.NODE_ENV === 'production') {
    const secureUrl = `https://api.presentandflow.cl/api/v1/habits/${habitId}/logs/`;
    console.log('Usando URL HTTPS para logHabitCompletion:', secureUrl);
    const response = await apiClient.post<HabitLog>(secureUrl, data);
    return response.data;
  } else {
    const response = await apiClient.post<HabitLog>(`/api/v1/habits/${habitId}/logs/`, data);
    return response.data;
  }
};

// Función para marcar un hábito como completado (versión simplificada)
export const markHabitAsCompleted = async (habitId: string): Promise<HabitLog> => {
  const today = new Date();
  const completionData: Omit<HabitLogCreate, 'habit_id'> = {
    completed_date: format(today, 'yyyy-MM-dd'),
  };
  
  return logHabitCompletion(habitId, completionData);
};

// Calcular estadísticas de hábitos para mostrar en el dashboard
export const calculateHabitStatistics = (habits: Habit[]): any => {
  if (!habits || habits.length === 0) {
    return {
      totalHabits: 0,
      activeHabits: 0,
      completedToday: 0,
      streaks: {
        current: 0,
        best: 0
      }
    };
  }
  
  const streaks = habits.map(habit => ({
    current: habit.current_streak || 0,
    best: habit.best_streak || 0
  }));
  
  const maxCurrentStreak = Math.max(...streaks.map(s => s.current));
  const maxBestStreak = Math.max(...streaks.map(s => s.best));
  
  return {
    totalHabits: habits.length,
    activeHabits: habits.length, // Todos están activos por ahora, podría filtrarse
    completedToday: 0, // Requiere logs para calcular
    streaks: {
      current: maxCurrentStreak,
      best: maxBestStreak
    }
  };
};

export const habitService = {
  getTodayHabitLogs: async (): Promise<{ habit_id: string; completed: boolean }[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_date')
        .eq('completed_date', today);

      if (error) {
        throw error;
      }

      return data.map(log => ({
        habit_id: log.habit_id,
        completed: true
      }));
    } catch (error) {
      console.error('Error al obtener los logs de hábitos:', error);
      return [];
    }
  },
}; 
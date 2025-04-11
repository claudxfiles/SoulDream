import { 
  Habit, 
  HabitCreate, 
  HabitUpdate, 
  HabitLog, 
  HabitLogCreate 
} from '@/types/habit';
import axios from 'axios';
import { format, isToday, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';

// Configuración de axios directamente, sin dependencias del apiClient
const secureAxios = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? 'https://api.presentandflow.cl' : undefined,
  headers: { 'Content-Type': 'application/json' }
});

// Log para verificación
console.log('Configuración de secureAxios:', {
  baseURL: secureAxios.defaults.baseURL,
  environment: process.env.NODE_ENV
});

// Asegurar que todas las solicitudes usen HTTPS
secureAxios.interceptors.request.use(config => {
  // Lógica para HTTPS
  if (process.env.NODE_ENV === 'production') {
    console.log('Interceptor de secureAxios activado');
    // Forzar baseURL HTTPS
    config.baseURL = 'https://api.presentandflow.cl';
    
    // Si hay una URL absoluta, convertirla a HTTPS
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
      console.log('URL convertida a HTTPS:', config.url);
    }
  }
  
  console.log('secureAxios request:', {
    url: config.url,
    baseURL: config.baseURL,
    method: config.method
  });
  
  return config;
});

// Obtener token de autenticación de Supabase
async function getAuthToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch (error) {
    console.error('Error obteniendo token de autenticación:', error);
    return null;
  }
}

// Obtener todos los hábitos del usuario
export const getHabits = async (category?: string): Promise<Habit[]> => {
  const params = category ? { category } : {};
  const token = await getAuthToken();
  
  console.log('getHabits solicitando con URL absoluta HTTPS');
  
  try {
    const response = await secureAxios.get('/api/v1/habits/', { 
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data || [];
  } catch (error) {
    console.error('Error en getHabits:', error);
    return [];
  }
};

// Obtener un hábito específico
export const getHabit = async (habitId: string): Promise<Habit> => {
  console.log(`getHabit para ID ${habitId} usando URL HTTPS absoluta`);
  const token = await getAuthToken();
  
  try {
    const response = await secureAxios.get(`/api/v1/habits/${habitId}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo hábito ${habitId}:`, error);
    throw new Error('Error al obtener el hábito');
  }
};

// Crear un nuevo hábito
export const createHabit = async (habit: HabitCreate): Promise<Habit> => {
  console.log('createHabit usando URL HTTPS absoluta');
  const token = await getAuthToken();
  
  try {
    const response = await secureAxios.post('/api/v1/habits/', habit, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data;
  } catch (error) {
    console.error('Error creando hábito:', error);
    throw new Error('Error al crear el hábito');
  }
};

// Actualizar un hábito existente
export const updateHabit = async (habitId: string, habit: HabitUpdate): Promise<Habit> => {
  console.log(`updateHabit para ID ${habitId} usando URL HTTPS absoluta`);
  const token = await getAuthToken();
  
  try {
    const response = await secureAxios.put(`/api/v1/habits/${habitId}/`, habit, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data;
  } catch (error) {
    console.error(`Error actualizando hábito ${habitId}:`, error);
    throw new Error('Error al actualizar el hábito');
  }
};

// Eliminar un hábito
export const deleteHabit = async (habitId: string): Promise<void> => {
  console.log(`deleteHabit para ID ${habitId} usando URL HTTPS absoluta`);
  const token = await getAuthToken();
  
  try {
    await secureAxios.delete(`/api/v1/habits/${habitId}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
  } catch (error) {
    console.error(`Error eliminando hábito ${habitId}:`, error);
    throw new Error('Error al eliminar el hábito');
  }
};

// Obtener los registros de un hábito
export const getHabitLogs = async (
  habitId: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<HabitLog[]> => {
  console.log(`getHabitLogs para ID ${habitId} usando URL HTTPS absoluta`);
  const token = await getAuthToken();
  
  const params: Record<string, string> = {};
  if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
  if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
  
  try {
    const response = await secureAxios.get(`/api/v1/habits/${habitId}/logs/`, {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data || [];
  } catch (error) {
    console.error(`Error obteniendo logs para hábito ${habitId}:`, error);
    return [];
  }
};

// Registrar completitud de un hábito
export const logHabitCompletion = async (
  habitId: string, 
  logData: Omit<HabitLogCreate, 'habit_id'>
): Promise<HabitLog> => {
  console.log(`logHabitCompletion para ID ${habitId} usando URL HTTPS absoluta`);
  const token = await getAuthToken();
  
  const data: HabitLogCreate = { ...logData, habit_id: habitId };
  
  try {
    const response = await secureAxios.post(`/api/v1/habits/${habitId}/logs/`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    return response.data;
  } catch (error) {
    console.error(`Error registrando completitud para hábito ${habitId}:`, error);
    throw new Error('Error al registrar la completitud del hábito');
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

// Servicio para compatibilidad con código existente
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
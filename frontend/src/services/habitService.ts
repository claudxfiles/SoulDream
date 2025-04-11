import { apiClient } from '@/lib/api-client';
import { Habit, HabitCreate, HabitUpdate, HabitLog, HabitLogCreate } from '@/types/habit';
import { supabase } from '@/lib/supabase';

// Función para asegurar que siempre usamos HTTPS en producción
const secureUrl = (path: string): string => {
  if (process.env.NODE_ENV === 'production') {
    // Asegurarnos de que la URL sea absoluta y HTTPS
    if (path.startsWith('/')) {
      return `https://api.presentandflow.cl${path}`;
    }
    return path.replace('http://', 'https://');
  }
  return path;
};

// Servicio para gestionar hábitos
export const habitService = {
  // Obtener todos los hábitos
  getHabits: async (): Promise<Habit[]> => {
    try {
      console.log('Solicitando hábitos con URL:', secureUrl('/api/v1/habits/'));
      const response = await apiClient.get(secureUrl('/api/v1/habits/'));
      return response.data || [];
    } catch (error: any) {
      console.error('Error al obtener hábitos:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener los hábitos');
    }
  },
  
  // Obtener un hábito por ID
  getHabitById: async (habitId: string): Promise<Habit> => {
    try {
      const url = secureUrl(`/api/v1/habits/${habitId}`);
      console.log('Solicitando hábito con URL:', url);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error(`Error al obtener hábito ${habitId}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al obtener el hábito');
    }
  },
  
  // Crear un nuevo hábito
  createHabit: async (habit: HabitCreate): Promise<Habit> => {
    try {
      const habitData = {
        title: habit.title,
        description: habit.description || null,
        frequency: habit.frequency || 'daily',
        specific_days: habit.specific_days || null,
        category: habit.category || null,
        goal_value: habit.goal_value || 1,
        is_active: true
      };
      
      const url = secureUrl('/api/v1/habits/');
      console.log('Creando hábito con URL:', url);
      const response = await apiClient.post(url, habitData);
      return response.data;
    } catch (error: any) {
      console.error('Error al crear hábito:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear el hábito');
    }
  },
  
  // Actualizar un hábito existente
  updateHabit: async (habit: HabitUpdate & { id: string }): Promise<Habit> => {
    try {
      const { id, ...updateData } = habit;
      const url = secureUrl(`/api/v1/habits/${id}/`);
      console.log('Actualizando hábito con URL:', url);
      const response = await apiClient.put<Habit>(url, updateData);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error al actualizar hábito ${habit.id}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar el hábito');
    }
  },
  
  // Eliminar un hábito
  deleteHabit: async (habitId: string): Promise<void> => {
    try {
      const url = secureUrl(`/api/v1/habits/${habitId}/`);
      console.log('Eliminando hábito con URL:', url);
      const response = await apiClient.delete(url);
      
      // Verificar si la respuesta es exitosa (204 No Content o 200 OK)
      if (response.status !== 204 && response.status !== 200) {
        throw new Error('Error al eliminar el hábito');
      }
    } catch (error: any) {
      // Si el error es 404, consideramos que el hábito ya fue eliminado
      if (error.response?.status === 404) {
        return;
      }
      
      console.error(`Error al eliminar hábito ${habitId}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar el hábito');
    }
  },
  
  // Obtener logs de un hábito
  getHabitLogs: async (habitId: string): Promise<HabitLog[]> => {
    try {
      const url = secureUrl(`/api/v1/habits/${habitId}/logs/`);
      console.log('Obteniendo logs de hábito con URL:', url);
      const response = await apiClient.get(url);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error(`Error al obtener logs del hábito ${habitId}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al obtener los logs del hábito');
    }
  },
  
  // Registrar un nuevo log de hábito
  logHabit: async (logData: HabitLogCreate): Promise<HabitLog> => {
    try {
      const logToSend = {
        habit_id: logData.habit_id,
        completed_date: logData.completed_date,
        notes: logData.notes || null,
        quality_rating: logData.quality_rating || null,
        emotion: logData.emotion || null,
        value: logData.value || 1
      };
      
      const url = secureUrl(`/api/v1/habits/${logData.habit_id}/logs/`);
      console.log('Registrando log de hábito con URL:', url);
      const response = await apiClient.post<HabitLog>(url, logToSend);
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`Error al registrar log para hábito ${logData.habit_id}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al registrar el hábito como completado');
    }
  },
  
  // Eliminar un log de hábito
  deleteHabitLog: async (logId: string): Promise<void> => {
    try {
      const url = secureUrl(`/api/v1/habit-logs/${logId}/`);
      console.log('Eliminando log de hábito con URL:', url);
      const response = await apiClient.delete(url);
      if (response.status !== 204 && response.status !== 200) {
        throw new Error('Error al eliminar el log');
      }
    } catch (error: any) {
      console.error(`Error al eliminar log ${logId}:`, error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar el log');
    }
  },
  
  // Obtener estadísticas de un hábito
  getHabitStats: async (habitId: string): Promise<any> => {
    try {
      const url = secureUrl(`/api/v1/habits/${habitId}/stats/`);
      console.log('Obteniendo estadísticas de hábito con URL:', url);
      const response = await apiClient.get(url);
      return response.data || {};
    } catch (error) {
      console.error(`Error al obtener estadísticas del hábito ${habitId}:`, error);
      return {};
    }
  },
  
  // Función de diagnóstico para depurar problemas de hábitos
  getDiagnostic: async (): Promise<any> => {
    try {
      const url = secureUrl('/api/v1/habits/diagnostic');
      console.log('Obteniendo diagnóstico con URL:', url);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener diagnóstico:', error);
      throw error;
    }
  },

  // Obtener los logs de hoy para todos los hábitos
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
  }
}; 
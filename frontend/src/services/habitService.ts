import { apiClient } from '@/lib/api-client';
import { Habit, HabitCreate, HabitUpdate, HabitLog, HabitLogCreate } from '@/types/habit';

// Servicio para gestionar hábitos
export const habitService = {
  // Obtener todos los hábitos
  getHabits: async (): Promise<Habit[]> => {
    try {
      const response = await apiClient.get('/api/v1/habits/');
      return response.data || [];
    } catch (error: any) {
      console.error('Error al obtener hábitos:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener los hábitos');
    }
  },
  
  // Obtener un hábito por ID
  getHabitById: async (habitId: string): Promise<Habit> => {
    try {
      const response = await apiClient.get(`/api/v1/habits/${habitId}`);
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
      
      const response = await apiClient.post('/api/v1/habits/', habitData);
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
      const response = await apiClient.put<Habit>(`/api/v1/habits/${id}/`, updateData);
      
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
      const response = await apiClient.delete(`/api/v1/habits/${habitId}/`);
      
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
      const response = await apiClient.get(`/api/v1/habits/${habitId}/logs/`);
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
      
      const response = await apiClient.post<HabitLog>(`/api/v1/habits/${logData.habit_id}/logs/`, logToSend);
      
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
      const response = await apiClient.delete(`/api/v1/habit-logs/${logId}/`);
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
      const response = await apiClient.get(`/api/v1/habits/${habitId}/stats/`);
      return response.data || {};
    } catch (error) {
      console.error(`Error al obtener estadísticas del hábito ${habitId}:`, error);
      return {};
    }
  },
  
  // Función de diagnóstico para depurar problemas de hábitos
  getDiagnostic: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/v1/habits/diagnostic');
      return response.data;
    } catch (error) {
      console.error('Error al obtener diagnóstico:', error);
      throw error;
    }
  }
}; 
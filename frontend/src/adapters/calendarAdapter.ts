import { CalendarEvent, CalendarEventInput } from '@/types/calendar';
import { Task } from '@/types/task';
import { Goal } from '@/types/goal';
import { Habit } from '@/types/habit';
import { Workout } from '@/types/workout';
import { parseISO, addHours } from 'date-fns';

export const calendarAdapter = {
  // Convertir tarea a evento de calendario
  taskToEvent(task: Task): CalendarEventInput {
    return {
      title: task.title,
      description: task.description,
      startDateTime: task.due_date,
      endDateTime: addHours(parseISO(task.due_date), 1).toISOString(),
      taskId: task.id,
      color: getPriorityColor(task.priority),
      reminderMinutes: [30], // Recordatorio por defecto 30 minutos antes
    };
  },

  // Convertir meta a evento de calendario
  goalToEvent(goal: Goal): CalendarEventInput {
    return {
      title: `Meta: ${goal.title}`,
      description: `${goal.description}\nProgreso: ${goal.progress}%`,
      startDateTime: goal.deadline,
      endDateTime: goal.deadline,
      goalId: goal.id,
      isAllDay: true,
      color: getProgressColor(goal.progress),
    };
  },

  // Convertir hábito a evento de calendario
  habitToEvent(habit: Habit, date: string): CalendarEventInput {
    return {
      title: `Hábito: ${habit.title}`,
      description: habit.description,
      startDateTime: date,
      endDateTime: date,
      habitId: habit.id,
      isAllDay: true,
      recurrenceRule: habit.frequency,
      color: getHabitColor(habit.category),
    };
  },

  // Convertir entrenamiento a evento de calendario
  workoutToEvent(workout: Workout): CalendarEventInput {
    return {
      title: `Entrenamiento: ${workout.title}`,
      description: `${workout.description}\nDuración: ${workout.duration} minutos`,
      startDateTime: workout.scheduledDate,
      endDateTime: addHours(parseISO(workout.scheduledDate), 1).toISOString(),
      workoutId: workout.id,
      color: getWorkoutColor(workout.type),
    };
  },
};

// Funciones auxiliares para colores
function getPriorityColor(priority: string): string {
  const colors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };
  return colors[priority] || '#6b7280';
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return '#10b981';
  if (progress >= 50) return '#f59e0b';
  return '#6b7280';
}

function getHabitColor(category: string): string {
  const colors = {
    health: '#10b981',
    productivity: '#3b82f6',
    learning: '#8b5cf6',
    lifestyle: '#ec4899',
  };
  return colors[category] || '#6b7280';
}

function getWorkoutColor(type: string): string {
  const colors = {
    strength: '#ef4444',
    cardio: '#3b82f6',
    flexibility: '#8b5cf6',
    sports: '#f59e0b',
  };
  return colors[type] || '#6b7280';
} 
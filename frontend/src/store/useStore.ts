"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definir los tipos para nuestro estado
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
}

interface Habit {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'specific_days';
  currentStreak: number;
  bestStreak: number;
}

interface AppState {
  // Estado de la UI
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Estado de tareas
  tasks: Task[];
  
  // Estado de hábitos
  habits: Habit[];
  
  // Acciones
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
}

// Crear el store
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Estado inicial
      theme: 'light',
      sidebarOpen: true,
      tasks: [],
      habits: [],
      
      // Acciones
      setTheme: (theme) => {
        // Actualizar la clase dark en el documento HTML cuando se cambia el tema
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
          // Guardar en localStorage
          localStorage.setItem('theme', theme);
        }
        set({ theme });
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Acciones de tareas
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updatedTask) => 
        set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === id ? { ...task, ...updatedTask } : task
          ),
        })),
      deleteTask: (id) => 
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      
      // Acciones de hábitos
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
      updateHabit: (id, updatedHabit) => 
        set((state) => ({
          habits: state.habits.map((habit) => 
            habit.id === id ? { ...habit, ...updatedHabit } : habit
          ),
        })),
      deleteHabit: (id) => 
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        })),
    }),
    {
      name: 'souldream-storage', // Nombre para localStorage
    }
  )
); 
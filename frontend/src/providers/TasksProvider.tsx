import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '@/types/tasks';
import { taskService } from '@/lib/services/taskService';
import { useToast } from '@/components/ui/use-toast';

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  createTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refetchTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar las tareas'));
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tareas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (task: Omit<Task, 'id'>) => {
    try {
      const newTask = await taskService.createTask(task);
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: 'Éxito',
        description: 'Tarea creada correctamente',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    try {
      const updatedTask = await taskService.updateTask(id, task);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      toast({
        title: 'Éxito',
        description: 'Tarea actualizada correctamente',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada correctamente',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tarea',
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <TasksContext.Provider 
      value={{ 
        tasks, 
        isLoading, 
        error, 
        createTask, 
        updateTask, 
        deleteTask,
        refetchTasks: fetchTasks
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}; 
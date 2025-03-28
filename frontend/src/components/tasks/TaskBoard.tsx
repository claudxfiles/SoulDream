'use client';

import React, { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, MoreVertical, Tag, Calendar, Trash2, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { Task } from '@/types/tasks';
import { useTasks } from '@/providers/TasksProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { TaskFormModal } from './TaskFormModal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/providers/AuthProvider';

// Importar dinámicamente los componentes relacionados con Google Calendar
const AddTaskToCalendarButton = dynamic(
  () => import('@/components/calendar/AddTaskToCalendarButton').then(mod => mod.AddTaskToCalendarButton),
  { ssr: false }
);

const CalendarStatusWrapper = dynamic(
  () => import('@/components/tasks/CalendarStatusWrapper').then(mod => mod.CalendarStatusWrapper),
  { ssr: false }
);

// Componente para una tarea individual
const TaskCard = ({ task, onDelete, onStatusChange, onEdit, onUpdateTask }: { 
  task: Task; 
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuthContext();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Normal';
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(task.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <>
      <Card className="mb-3 p-4 cursor-pointer hover:shadow-md transition-shadow bg-gray-900/90 border-gray-800">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-gray-100">{task.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-200">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          {task.tags && task.tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-200"
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center space-x-2">
            {task.due_date && (
              <div className="flex items-center text-gray-400">
                <Calendar size={14} className="mr-1" />
                {format(new Date(task.due_date), 'dd MMM', { locale: es })}
              </div>
            )}
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
            {getPriorityText(task.priority)}
          </span>
        </div>
      </Card>

      {/* Diálogo de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Componente para una columna del tablero
const Column = ({ 
  title, 
  tasks, 
  status,
  onAddTask,
  onDeleteTask,
  onStatusChange,
  onEdit,
  onUpdateTask
}: { 
  title: string; 
  tasks: Task[]; 
  status: Task['status'];
  onAddTask: (status: Task['status']) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
}) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 w-full min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center">
          {title}
          <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h2>
        <button 
          onClick={() => onAddTask(status)}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <div className="space-y-3 min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onDelete={onDeleteTask}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onUpdateTask={onUpdateTask}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay tareas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal del tablero
export function TaskBoard() {
  const { tasks = [], isLoading, error, deleteTask, updateTask, createTask } = useTasks() || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Task['status']>('pending');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (status: Task['status']) => {
    setCurrentStatus(status);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (deleteTask) {
      await deleteTask(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Task['status']) => {
    if (updateTask) {
      await updateTask(id, { status: newStatus });
    }
  };

  const handleSubmitTask = async (taskData: Omit<Task, 'id'>) => {
    if (editingTask && updateTask) {
      await updateTask(editingTask.id, taskData);
    } else if (createTask) {
      await createTask(taskData);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  // Filtrar tareas por estado
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tablero de tareas</h1>
        <button 
          onClick={() => handleAddTask('pending')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Nueva tarea
        </button>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4">
        <Column 
          title="Pendientes" 
          tasks={pendingTasks} 
          status="pending"
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onEdit={handleEditTask}
          onUpdateTask={updateTask || (async () => {})}
        />
        <Column 
          title="En progreso" 
          tasks={inProgressTasks} 
          status="in_progress"
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onEdit={handleEditTask}
          onUpdateTask={updateTask || (async () => {})}
        />
        <Column 
          title="Completadas" 
          tasks={completedTasks} 
          status="completed"
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
          onEdit={handleEditTask}
          onUpdateTask={updateTask || (async () => {})}
        />
      </div>

      <TaskFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmitTask}
        initialStatus={currentStatus}
        initialData={editingTask || undefined}
      />
    </div>
  );
} 
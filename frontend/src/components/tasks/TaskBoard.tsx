'use client';

import React, { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, MoreVertical, Clock, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import dynamic from 'next/dynamic';

// Importar dinámicamente los componentes relacionados con Google Calendar
const AddTaskToCalendarButton = dynamic(
  () => import('@/components/calendar/AddTaskToCalendarButton').then(mod => mod.AddTaskToCalendarButton),
  { ssr: false }
);

const CalendarStatusWrapper = dynamic(
  () => import('@/components/tasks/CalendarStatusWrapper').then(mod => mod.CalendarStatusWrapper),
  { ssr: false }
);

// Tipos para las tareas
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags: string[];
}

// Componente para una tarea individual
const TaskCard = ({ task }: { task: Task }) => {
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

  return (
    <Card className="mb-3 p-3 cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <MoreVertical size={16} />
        </button>
      </div>
      
      {task.description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="mt-3 flex flex-wrap gap-2">
        {task.tags.map((tag, index) => (
          <span 
            key={index} 
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
          >
            <Tag size={12} className="mr-1" />
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-xs">
        {task.dueDate && (
          <span className="flex items-center text-gray-500 dark:text-gray-400">
            <Calendar size={12} className="mr-1" />
            {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
          </span>
        )}
        
        <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
          {getPriorityText(task.priority)}
        </span>
      </div>
      
      {task.dueDate && (
        <Suspense fallback={null}>
          <CalendarStatusWrapper>
            {(isConnected) => isConnected && (
              <div className="mt-3 flex justify-end">
                <AddTaskToCalendarButton 
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    due_date: task.dueDate,
                    status: task.status,
                    priority: task.priority
                  }} 
                />
              </div>
            )}
          </CalendarStatusWrapper>
        </Suspense>
      )}
    </Card>
  );
};

// Componente para una columna del tablero
const Column = ({ 
  title, 
  tasks, 
  status,
  onAddTask 
}: { 
  title: string; 
  tasks: Task[]; 
  status: 'pending' | 'in_progress' | 'completed';
  onAddTask: (status: 'pending' | 'in_progress' | 'completed') => void;
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
          <TaskCard key={task.id} task={task} />
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
  // Datos de ejemplo
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Crear diseño de la aplicación',
      description: 'Diseñar la interfaz de usuario para la nueva aplicación móvil',
      status: 'completed',
      priority: 'high',
      dueDate: '2023-05-15',
      tags: ['Diseño', 'UI/UX']
    },
    {
      id: '2',
      title: 'Implementar autenticación',
      description: 'Integrar sistema de autenticación con Firebase',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2023-05-20',
      tags: ['Backend', 'Seguridad']
    },
    {
      id: '3',
      title: 'Optimizar rendimiento',
      description: 'Mejorar tiempos de carga y optimizar consultas a la base de datos',
      status: 'pending',
      priority: 'medium',
      dueDate: '2023-05-25',
      tags: ['Performance']
    },
    {
      id: '4',
      title: 'Escribir documentación',
      description: 'Documentar APIs y componentes principales',
      status: 'pending',
      priority: 'low',
      dueDate: '2023-05-30',
      tags: ['Documentación']
    },
    {
      id: '5',
      title: 'Pruebas de integración',
      description: 'Crear y ejecutar pruebas de integración para los módulos principales',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2023-05-22',
      tags: ['Testing', 'QA']
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  const handleAddTask = (status: 'pending' | 'in_progress' | 'completed') => {
    setCurrentStatus(status);
    setIsModalOpen(true);
  };

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
        />
        <Column 
          title="En progreso" 
          tasks={inProgressTasks} 
          status="in_progress"
          onAddTask={handleAddTask} 
        />
        <Column 
          title="Completadas" 
          tasks={completedTasks} 
          status="completed"
          onAddTask={handleAddTask} 
        />
      </div>
      
      {/* Aquí iría el modal para añadir/editar tareas */}
    </div>
  );
} 
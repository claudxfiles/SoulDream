'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
}

interface UpcomingTasksCardProps {
  tasks: Task[];
}

// Helper function to get priority icon and color
const getPriorityInfo = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return { Icon: AlertCircle, color: 'text-red-500' };
    case 'medium':
      return { Icon: Clock, color: 'text-yellow-500' };
    case 'low':
    default:
      return { Icon: CheckSquare, color: 'text-green-500' };
  }
};

export function UpcomingTasksCard({ tasks }: UpcomingTasksCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tareas próximas</CardTitle>
        <Link href="/dashboard/tasks" className="text-xs text-muted-foreground hover:text-primary">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas próximas.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const { Icon, color } = getPriorityInfo(task.priority);
              const formattedDate = task.due_date 
                ? `Vence: ${format(parseISO(task.due_date), 'PPP', { locale: es })}`
                : 'Sin fecha límite';
              return (
                <li key={task.id} className="flex items-start space-x-3">
                  <Icon className={`h-4 w-4 mt-1 ${color}`} />
                  <div>
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{formattedDate}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 
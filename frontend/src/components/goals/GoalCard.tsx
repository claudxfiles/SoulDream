'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal, GoalPriority, GoalArea, GoalStatus } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GoalCardProps {
  goal: Goal;
  isSelected?: boolean;
  onClick?: () => void;
}

const AREA_COLORS: Record<GoalArea, string> = {
  'Desarrollo Personal': 'bg-blue-500',
  'Salud y Bienestar': 'bg-green-500',
  'Educación': 'bg-purple-500',
  'Finanzas': 'bg-yellow-500',
  'Hobbies': 'bg-pink-500',
} as const;

const PRIORITY_COLORS: Record<GoalPriority, string> = {
  'Alta': 'bg-red-500',
  'Media': 'bg-yellow-500',
  'Baja': 'bg-green-500',
} as const;

const STATUS_COLORS: Record<GoalStatus, string> = {
  'active': 'bg-blue-500',
  'completed': 'bg-green-500',
  'archived': 'bg-gray-500',
} as const;

export function GoalCard({ goal, isSelected = false, onClick }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En progreso';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  const getPriorityColor = () => {
    return PRIORITY_COLORS[goal.priority] || 'bg-gray-500';
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

  const getTypeText = (type: string) => {
    switch (type) {
      case 'adquisicion':
        return 'Adquisición';
      case 'aprendizaje':
        return 'Aprendizaje';
      case 'habito':
        return 'Hábito';
      case 'otro':
        return 'Otro';
      default:
        return 'Otro';
    }
  };

  const getProgressValue = () => {
    if (goal.progress_type === 'percentage') {
      return goal.current_value ?? 0;
    }
    if (goal.progress_type === 'numeric' && goal.target_value && goal.current_value) {
      return (goal.current_value / goal.target_value) * 100;
    }
    return 0;
  };

  const getStatusColor = () => {
    return STATUS_COLORS[goal.status] || 'bg-gray-500';
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={cn('h-5', AREA_COLORS[goal.area])}>
            {goal.area}
          </Badge>
          <div className="flex gap-2">
            <Badge className={cn('h-5', getPriorityColor())}>
              {goal.priority}
            </Badge>
            <Badge className={cn('h-5', getStatusColor())}>
              {goal.status}
            </Badge>
          </div>
        </div>
        <CardTitle className="line-clamp-2">{goal.title}</CardTitle>
        {goal.description && (
          <CardDescription className="line-clamp-2">
            {goal.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={getProgressValue()} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{getProgressValue().toFixed(0)}%</span>
            {goal.target_date && (
              <span>
                Fecha límite: {format(new Date(goal.target_date), 'PPP', { locale: es })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
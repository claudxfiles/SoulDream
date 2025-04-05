'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
import { useGoalsStore, Goal } from '@/store/goals/useGoalsStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GoalCardProps {
  goal: Goal;
  areaName: string;
  areaIcon: React.ReactNode;
}

const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case 'completed':
      return "secondary";
    case 'abandoned':
      return "destructive";
    default:
      return "default";
  }
};

export function GoalCard({ goal, areaName, areaIcon }: GoalCardProps) {
  const { setSelectedGoal } = useGoalsStore();
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

  const progress = goal.progress_type === 'percentage' 
    ? (goal.current_value || 0) 
    : ((goal.current_value || 0) / (goal.target_value || 1)) * 100;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        goal.status === 'completed' && "bg-green-50",
        goal.status === 'abandoned' && "bg-gray-50"
      )}
      onClick={() => setSelectedGoal(goal)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">{goal.title}</h3>
            {goal.priority === 'high' && (
              <Badge variant="destructive">High Priority</Badge>
            )}
          </div>
          <Badge variant={getStatusVariant(goal.status)}>
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{goal.description}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                {goal.target_date
                  ? format(new Date(goal.target_date), 'MMM d, yyyy')
                  : 'No due date'}
              </span>
            </div>
            <Badge variant="outline">{goal.area}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
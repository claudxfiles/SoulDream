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
  AlertCircle,
  Timer,
  Plus,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal, GoalPriority, GoalArea, GoalStatus, GoalStep } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGoalSteps } from '@/hooks/goals/useGoalSteps';
import { CreateGoalStepDialog } from './CreateGoalStepDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateStepDialogOpen, setIsCreateStepDialogOpen] = useState(false);
  const { steps, isLoading, updateStep } = useGoalSteps(goal.id);

  const progress = Math.min(
    ((goal.current_value || 0) / (goal.target_value || 100)) * 100,
    100
  );

  const getStepStatusIcon = (status: GoalStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Timer className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStepStatusText = (status: GoalStep['status']) => {
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

  const handleStepStatusChange = async (stepId: string, newStatus: GoalStep['status']) => {
    try {
      await updateStep.mutateAsync({
        id: stepId,
        updates: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating step status:', error);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          'transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge className={cn('h-5', AREA_COLORS[goal.area])}>
              {goal.area}
            </Badge>
            <div className="flex gap-2">
              <Badge className={cn('h-5', PRIORITY_COLORS[goal.priority])}>
                {goal.priority}
              </Badge>
              <Badge className={cn('h-5', STATUS_COLORS[goal.status])}>
                {goal.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className="line-clamp-2">{goal.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {goal.description && (
            <CardDescription className="line-clamp-2">
              {goal.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              {goal.target_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(goal.target_date), 'PPP', { locale: es })}
                </span>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Pasos a seguir</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateStepDialogOpen(true)}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar paso
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : steps && steps.length > 0 ? (
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            {getStepStatusIcon(step.status)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => handleStepStatusChange(step.id, 'completed')}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            <span>Completado</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStepStatusChange(step.id, 'in_progress')}
                          >
                            <Timer className="mr-2 h-4 w-4 text-blue-500" />
                            <span>En progreso</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStepStatusChange(step.id, 'pending')}
                          >
                            <Circle className="mr-2 h-4 w-4 text-gray-400" />
                            <span>Pendiente</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{step.title}</h4>
                        {step.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {step.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{getStepStatusText(step.status)}</span>
                          {step.due_date && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(step.due_date), 'PPP', { locale: es })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No hay pasos definidos para esta meta.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateGoalStepDialog
        goalId={goal.id}
        open={isCreateStepDialogOpen}
        onOpenChange={setIsCreateStepDialogOpen}
      />
    </>
  );
} 
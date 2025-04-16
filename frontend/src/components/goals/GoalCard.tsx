'use client';

import React, { useState, useMemo } from 'react';
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
  MoreVertical,
  Trash2,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal, GoalPriority, GoalArea, GoalStatus, GoalStep } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useGoalSteps } from '@/hooks/goals/useGoalSteps';
import { useGoals } from '@/hooks/goals/useGoals';
import { CreateGoalStepDialog } from './CreateGoalStepDialog';
import { UpdateGoalDialog } from './UpdateGoalDialog';
import { UpdateGoalStepDialog } from './UpdateGoalStepDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isFullView, setIsFullView] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isCreateStepDialogOpen, setIsCreateStepDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<GoalStep | null>(null);
  const { steps, isLoading, updateStep, deleteStep } = useGoalSteps(goal.id);
  const { updateGoal, deleteGoal } = useGoals();

  const { progress, completedSteps, totalSteps } = useMemo(() => {
    if (!steps || steps.length === 0) {
      return { progress: 0, completedSteps: 0, totalSteps: 0 };
    }

    const total = steps.length;
    const completed = steps.filter(step => step.status === 'completed').length;
    const inProgress = steps.filter(step => step.status === 'in_progress').length;
    
    // Calculamos el progreso considerando los pasos en progreso como medio completados
    const progressValue = ((completed + (inProgress * 0.5)) / total) * 100;
    
    return {
      progress: Math.round(progressValue),
      completedSteps: completed,
      totalSteps: total
    };
  }, [steps]);

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

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const toggleFullView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir que el onClick de la Card se active
    setIsFullView(!isFullView);
  };

  const toggleStepExpansion = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation(); // Evitar la propagación del evento
    setExpandedSteps(prevExpandedSteps => {
      const newExpandedSteps = new Set(prevExpandedSteps);
      if (newExpandedSteps.has(stepId)) {
        newExpandedSteps.delete(stepId);
      } else {
        newExpandedSteps.add(stepId);
      }
      return newExpandedSteps;
    });
  };

  const expandAllSteps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!steps) return;
    
    if (expandedSteps.size === steps.length) {
      // Si todos están expandidos, colapsar todos
      setExpandedSteps(new Set());
    } else {
      // Expandir todos
      setExpandedSteps(new Set(steps.map(step => step.id)));
    }
  };

  const isStepExpanded = (stepId: string) => expandedSteps.has(stepId);
  const areAllStepsExpanded = steps?.length ? expandedSteps.size === steps.length : false;

  return (
    <>
      <Card 
        className={cn(
          'transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary',
          goal.status === 'completed' && 'opacity-70'
        )}
        onClick={onClick}
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
                {goal.status === 'active' ? 'Activa' : goal.status === 'completed' ? 'Completada' : 'Archivada'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullView}
                className="h-8 w-8 p-0"
              >
                {isFullView ? 
                  <Minimize2 className="h-4 w-4" /> : 
                  <Maximize2 className="h-4 w-4" />
                }
              </Button>
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
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditGoalDialogOpen(true);
                    }}
                  >
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <CardTitle className={isFullView ? "" : "line-clamp-2"}>
              <div className="prose dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{goal.title}</ReactMarkdown>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {goal.description && (
            <CardDescription className={isFullView ? "" : "line-clamp-2"}>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{goal.description}</ReactMarkdown>
              </div>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative pt-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progreso</span>
                <span className="text-muted-foreground">
                  {completedSteps} de {totalSteps} pasos completados
                </span>
              </div>
              <div className="overflow-hidden h-2 rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-primary font-medium">{progress}% completado</span>
                {goal.target_date && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.target_date), 'PPP', { locale: es })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(isExpanded || isFullView) && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Pasos a seguir</h4>
                  {steps && steps.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAllSteps}
                      className="h-8 p-1"
                      title={areAllStepsExpanded ? "Colapsar todos los pasos" : "Expandir todos los pasos"}
                    >
                      {areAllStepsExpanded ? 
                        <EyeOff className="h-4 w-4" /> : 
                        <Eye className="h-4 w-4" />
                      }
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreateStepDialogOpen(true);
                  }}
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
                      className="rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3 p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStep(step);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep.mutate(step.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={cn("text-sm font-medium", isFullView || isStepExpanded(step.id) ? "" : "truncate")}>
                              <div className="prose dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.title}</ReactMarkdown>
                              </div>
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleStepExpansion(e, step.id)}
                              className="h-6 w-6 p-0 ml-2"
                              title={isStepExpanded(step.id) ? "Colapsar paso" : "Expandir paso"}
                            >
                              {isStepExpanded(step.id) ? 
                                <ChevronUp className="h-3 w-3" /> : 
                                <ChevronDown className="h-3 w-3" />
                              }
                            </Button>
                          </div>
                          
                          {(isFullView || isStepExpanded(step.id)) && step.description && (
                            <div className="text-sm text-muted-foreground mt-2">
                              <div className="prose prose-sm dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.description}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {(!isFullView && !isStepExpanded(step.id)) && step.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              <div className="prose prose-sm dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.description}</ReactMarkdown>
                              </div>
                            </div>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStep(step);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep.mutate(step.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la meta "{goal.title}" y todos sus pasos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpdateGoalDialog
        goal={goal}
        open={isEditGoalDialogOpen}
        onOpenChange={setIsEditGoalDialogOpen}
        onSubmit={(goalId, updates) => {
          updateGoal.mutate({ id: goalId, updates });
        }}
      />

      {editingStep && (
        <UpdateGoalStepDialog
          step={editingStep}
          open={true}
          onOpenChange={(open) => !open && setEditingStep(null)}
          onSubmit={(stepId, updates) => {
            updateStep.mutate({ id: stepId, updates });
          }}
        />
      )}

      <CreateGoalStepDialog
        open={isCreateStepDialogOpen}
        onOpenChange={setIsCreateStepDialogOpen}
        goalId={goal.id}
      />
    </>
  );
}
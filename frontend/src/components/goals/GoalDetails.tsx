"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Goal, GoalStep } from '@/types/goals';
import { cn } from '@/lib/utils';
import { Pencil, Plus, Trash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GoalDetailsProps {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddStep?: () => void;
  onEditStep?: (step: GoalStep) => void;
  onDeleteStep?: (stepId: string) => void;
}

export function GoalDetails({
  goal,
  onEdit,
  onDelete,
  onAddStep,
  onEditStep,
  onDeleteStep
}: GoalDetailsProps) {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const getProgressValue = () => {
    if (goal.progress_type === 'percentage') {
      return goal.current_value ?? 0;
    } else if (goal.progress_type === 'numeric' && goal.target_value && goal.current_value) {
      return (goal.current_value / goal.target_value) * 100;
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'archived':
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="prose dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{goal.title}</ReactMarkdown>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="prose prose-sm dark:prose-invert text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{goal.description}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{goal.area}</Badge>
            <Badge variant="secondary">{goal.type}</Badge>
            <Badge variant="secondary">{goal.priority}</Badge>
            <Badge variant="secondary" className={getStatusColor(goal.status)}>
              {goal.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progreso</span>
            <span>{getProgressValue()}%</span>
          </div>
          <Progress value={getProgressValue()} />
          {goal.target_date && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Fecha objetivo:</span>
              <span>{new Date(goal.target_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pasos</h3>
            <Button variant="outline" size="sm" onClick={onAddStep}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar paso
            </Button>
          </div>

          <div className="space-y-2">
            {goal.steps?.map(step => (
              <Card
                key={step.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-sm',
                  expandedSteps.includes(step.id) && 'ring-1 ring-primary'
                )}
                onClick={() => toggleStep(step.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-medium prose prose-sm dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.title}</ReactMarkdown>
                      </h4>
                      {expandedSteps.includes(step.id) && (
                        <div className="prose prose-sm dark:prose-invert text-muted-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.description || ''}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(step.status)}
                      >
                        {step.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditStep?.(step);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStep?.(step.id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {expandedSteps.includes(step.id) && step.due_date && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Fecha límite: {new Date(step.due_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
"use client";

import { useState } from 'react';
import { Goal, GoalStep } from '@/store/goals/useGoalsStore';
import { useGoals } from '@/hooks/goals/useGoals';
import { useUser } from '@/hooks/auth/useUser';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle2, Circle, Clock, Target } from 'lucide-react';
import { GoalStepsList } from './GoalStepsList';
import { SubGoalsList } from './SubGoalsList';
import { UpdateGoalDialog } from './UpdateGoalDialog';
import { useDialog } from '@/hooks/ui/useDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GoalDetailsProps {
  goal: Goal;
}

export function GoalDetails({ goal }: GoalDetailsProps) {
  const { user } = useUser();
  const { updateGoal } = useGoals(user?.id || '');
  const { isOpen, onOpen, onClose } = useDialog();
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusChange = (newStatus: Goal['status']) => {
    updateGoal({
      id: goal.id,
      updates: { status: newStatus },
    });
  };

  const getCategoryColor = (category: Goal['category']) => {
    const colors = {
      personal_development: 'bg-blue-500',
      health_wellness: 'bg-green-500',
      education: 'bg-purple-500',
      finance: 'bg-yellow-500',
      hobbies: 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{goal.title}</h2>
          <p className="text-muted-foreground">{goal.description}</p>
        </div>
        <Button onClick={onOpen} variant="outline">
          Edit Goal
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={cn('capitalize', getCategoryColor(goal.category))}>
          {goal.category.replace('_', ' ')}
        </Badge>
        <Badge variant="outline" className={cn('capitalize', getPriorityColor(goal.priority))}>
          {goal.priority} Priority
        </Badge>
        <Badge variant="outline" className="capitalize">
          {goal.type}
        </Badge>
        <Badge
          variant="outline"
          className={cn('capitalize', {
            'bg-green-500 text-white': goal.status === 'completed',
            'bg-yellow-500 text-white': goal.status === 'active',
            'bg-red-500 text-white': goal.status === 'abandoned',
          })}
        >
          {goal.status}
        </Badge>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Progress: {goal.progressPercentage}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Due: {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Created: {format(new Date(goal.createdAt), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Updated: {format(new Date(goal.updatedAt), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
        </div>
      </Card>

      <Progress value={goal.progressPercentage} className="h-2" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="sub-goals">Sub-Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Status Actions</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  disabled={goal.status === 'active'}
                >
                  <Circle className="mr-1 h-4 w-4" />
                  Set Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('completed')}
                  disabled={goal.status === 'completed'}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Mark Complete
                </Button>
              </div>
            </div>
          </Card>

          {goal.visualizationImageUrl && (
            <Card className="overflow-hidden">
              <img
                src={goal.visualizationImageUrl}
                alt={goal.title}
                className="w-full object-cover"
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steps">
          <GoalStepsList goalId={goal.id} />
        </TabsContent>

        <TabsContent value="sub-goals">
          <SubGoalsList parentGoalId={goal.id} />
        </TabsContent>
      </Tabs>

      <UpdateGoalDialog goal={goal} isOpen={isOpen} onClose={onClose} />
    </div>
  );
} 
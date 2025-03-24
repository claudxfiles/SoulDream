"use client";

import { useEffect } from 'react';
import { useGoals } from '@/hooks/goals/useGoals';
import { useUser } from '@/hooks/auth/useUser';
import { GoalsList } from './GoalsList';
import { GoalDetails } from './GoalDetails';
import { CreateGoalDialog } from './CreateGoalDialog';
import { useGoalsStore } from '@/store/goals/useGoalsStore';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDialog } from '@/hooks/ui/useDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function GoalsModule() {
  const { user } = useUser();
  const { goals, isLoading } = useGoals(user?.id || '');
  const { selectedGoal } = useGoalsStore();
  const { isOpen, onOpen, onClose } = useDialog();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button onClick={onOpen} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </Button>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr,2fr]">
        <div className="flex flex-col space-y-4 overflow-auto">
          <GoalsList goals={goals || []} />
        </div>
        {selectedGoal && (
          <div className="flex flex-col space-y-4 overflow-auto rounded-lg border p-4">
            <GoalDetails goal={selectedGoal} />
          </div>
        )}
      </div>

      <CreateGoalDialog isOpen={isOpen} onClose={onClose} />
    </div>
  );
} 
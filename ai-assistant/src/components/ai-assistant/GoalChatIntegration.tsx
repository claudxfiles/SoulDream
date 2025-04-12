"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Goal, Task } from '@/hooks/useAIAssistant';
import { format } from 'date-fns';

interface GoalChatIntegrationProps {
  goals: Goal[];
  tasks: Task[];
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteGoal: (goalId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function GoalChatIntegration({
  goals,
  tasks,
  onUpdateGoal,
  onUpdateTask,
  onDeleteGoal,
  onDeleteTask,
}: GoalChatIntegrationProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Toggle goal expansion
  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    onUpdateTask(taskId, { status: newStatus as 'pending' | 'completed' | 'in-progress' });
  };

  // Mark goal as complete
  const completeGoal = (goalId: string) => {
    onUpdateGoal(goalId, { status: 'completed' });
  };

  if (goals.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No goals yet. Ask the AI assistant to help you create goals and tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const goalTasks = tasks.filter((task) => task.goalId === goal.id);
        const isExpanded = expandedGoalId === goal.id;
        const completedTaskCount = goalTasks.filter((task) => task.status === 'completed').length;
        const progress = goalTasks.length > 0
          ? Math.round((completedTaskCount / goalTasks.length) * 100)
          : 0;

        return (
          <Card
            key={goal.id}
            className={`border ${goal.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle
                  className={`text-sm font-medium ${goal.status === 'completed' ? 'text-green-700' : ''}`}
                >
                  {goal.title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {goal.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 text-green-600"
                      onClick={() => completeGoal(goal.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3 w-3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="sr-only">Complete</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600"
                    onClick={() => onDeleteGoal(goal.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>
            </CardHeader>

            <CardContent className="pb-4">
              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span>{completedTaskCount} of {goalTasks.length} tasks completed</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Created: {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                  </span>
                  {goal.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due: {format(new Date(goal.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => toggleGoalExpansion(goal.id)}
                >
                  {isExpanded ? 'Hide Tasks' : 'Show Tasks'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ml-1 h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  <Separator />

                  {goalTasks.length > 0 ? (
                    <ul className="space-y-2">
                      {goalTasks.map((task) => (
                        <li key={task.id} className="flex items-start justify-between gap-3 text-sm">
                          <div className="flex items-start gap-2">
                            <button
                              className={`mt-0.5 h-4 w-4 rounded-full border ${
                                task.status === 'completed'
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                              }`}
                              onClick={() => toggleTaskStatus(task.id, task.status)}
                            >
                              {task.status === 'completed' && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-3 w-3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              <span className="sr-only">Toggle task status</span>
                            </button>
                            <div>
                              <p className={task.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => onDeleteTask(task.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            <span className="sr-only">Delete</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-xs text-muted-foreground">
                      No tasks yet. Ask the AI assistant to help you create tasks for this goal.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useAIAssistant } from '@/hooks/useAIAssistant';
import { AIAssistant } from './AIAssistant';
import { GoalChatIntegration } from './GoalChatIntegration';
import { PersonalizedPlanGenerator } from './PersonalizedPlanGenerator';
import { PatternAnalyzer } from './PatternAnalyzer';

export function AiChatInterface() {
  const {
    messages,
    isProcessing,
    context,
    addUserMessage,
    addGoal,
    addTask,
    updateGoal,
    updateTask,
    deleteGoal,
    deleteTask,
    generatePersonalizedPlan,
  } = useAIAssistant();

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left Column: AI Chat Assistant */}
      <div className="h-full lg:col-span-2">
        <AIAssistant />
      </div>

      {/* Right Column: Goals & Tasks */}
      <div className="space-y-4 overflow-auto">
        <h2 className="font-semibold">Goals & Tasks</h2>

        {/* Pattern Analysis Card */}
        <PatternAnalyzer messages={messages} context={context} />

        {/* Plan Generator */}
        <PersonalizedPlanGenerator
          context={context}
          onGeneratePlan={generatePersonalizedPlan}
        />

        {/* Goals & Tasks List */}
        <GoalChatIntegration
          goals={context.goals}
          tasks={context.tasks}
          onUpdateGoal={updateGoal}
          onUpdateTask={updateTask}
          onDeleteGoal={deleteGoal}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
}

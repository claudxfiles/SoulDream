"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AIContext } from '@/hooks/useAIAssistant';
import { AIService } from '@/services/ai';

interface PersonalizedPlanGeneratorProps {
  context: AIContext;
  onGeneratePlan: () => void;
}

export function PersonalizedPlanGenerator({
  context,
  onGeneratePlan
}: PersonalizedPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      // In a complete implementation this would call the AI service
      // and then add the resulting plan to the context
      onGeneratePlan();
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border border-green-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-green-700">Personalized Plan</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Generate a personalized plan based on your goals and preferences.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-green-500"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Analyzes your performance patterns</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-green-500"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Creates achievable goals and tasks</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-green-500"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Adapts to your learning preferences</span>
          </div>
        </div>

        <Button
          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white"
          onClick={handleGeneratePlan}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating Plan...' : 'Generate Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AIContext } from '@/hooks/useAIAssistant';

interface LearningAdaptationProps {
  context: AIContext;
  onUpdatePreferences: (preferences: string[]) => void;
}

export function LearningAdaptation({
  context,
  onUpdatePreferences
}: LearningAdaptationProps) {
  const [expanded, setExpanded] = useState(false);

  // Predefined learning preferences
  const availablePreferences = [
    'Visual learning',
    'Text-based explanations',
    'Step-by-step guides',
    'Regular reminders',
    'Detailed feedback',
    'Minimal instructions',
    'Interactive exercises',
    'Example-based learning',
  ];

  // Toggle a preference
  const togglePreference = (preference: string) => {
    const currentPreferences = [...context.learningPreferences];
    const index = currentPreferences.indexOf(preference);

    if (index >= 0) {
      // Remove if already present
      currentPreferences.splice(index, 1);
    } else {
      // Add if not present
      currentPreferences.push(preference);
    }

    onUpdatePreferences(currentPreferences);
  };

  if (!expanded) {
    return (
      <Button
        variant="ghost"
        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={() => setExpanded(true)}
      >
        Customize AI learning preferences
      </Button>
    );
  }

  return (
    <Card className="border border-blue-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-700">Learning Preferences</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setExpanded(false)}
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Select how the AI assistant should adapt to your preferences:
        </p>
        <div className="flex flex-wrap gap-2">
          {availablePreferences.map((preference) => {
            const isSelected = context.learningPreferences.includes(preference);
            return (
              <Button
                key={preference}
                variant={isSelected ? "secondary" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => togglePreference(preference)}
              >
                {preference}
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1 h-3 w-3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AIContext, Message } from '@/hooks/useAIAssistant';
import { AIService } from '@/services/ai';

interface PatternAnalyzerProps {
  messages: Message[];
  context: AIContext;
}

export function PatternAnalyzer({ messages, context }: PatternAnalyzerProps) {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze patterns whenever there are enough new messages
  useEffect(() => {
    const analyzePatterns = async () => {
      // Only analyze if we have enough messages and not already analyzing
      if (messages.length > 5 && !isAnalyzing) {
        setIsAnalyzing(true);
        try {
          const results = await AIService.analyzePatterns(messages, context);
          setPatterns(results);
        } catch (error) {
          console.error('Error analyzing patterns:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    analyzePatterns();
  }, [messages, context]);

  if (patterns.length === 0) {
    return null; // Don't show anything if no patterns detected
  }

  return (
    <Card className="border border-blue-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-blue-700">Pattern Analysis</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-1 text-xs">
          {patterns.map((pattern, index) => (
            <li key={`pattern-${index}`} className="flex items-start gap-1.5">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{pattern}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

"use client";

import { useRef, useState } from 'react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { ChatMessage } from './ChatMessage';
import { PatternAnalyzer } from './PatternAnalyzer';
import { LearningAdaptation } from './LearningAdaptation';
import { PersonalizedPlanGenerator } from './PersonalizedPlanGenerator';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export function AIAssistant() {
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

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isProcessing) return;

    const message = inputValue;
    setInputValue('');

    await addUserMessage(message);
    scrollToBottom();
  };

  // Update learning preferences
  const handleUpdatePreferences = (preferences: string[]) => {
    // In a real implementation, this would update the context in the database
    console.log('Updated preferences:', preferences);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-background shadow">
      <CardHeader className="px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">AI Assistant</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 h-4 w-4"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9Z" />
                <path d="M9 12h6" />
                <path d="M12 9v6" />
              </svg>
              New Chat
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <div className="flex-1 overflow-auto p-1">
        <div className="space-y-px">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isProcessing && (
            <div className="flex w-full gap-3 bg-background p-4">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-xs text-white">AI</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Assistant</span>
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-75" />
                  <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-150" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-center">
          <LearningAdaptation
            context={context}
            onUpdatePreferences={handleUpdatePreferences}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isProcessing}
          />
          <Button
            type="submit"
            variant="default"
            disabled={isProcessing || !inputValue.trim()}
          >
            <span className="sr-only">Send</span>
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
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
}

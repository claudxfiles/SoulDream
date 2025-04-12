"use client";

import { useState, useEffect, useCallback } from 'react';

// Define types for our messages and AI context
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  dueDate?: Date;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  dueDate?: Date;
}

export interface AIContext {
  goals: Goal[];
  tasks: Task[];
  learningPreferences: string[];
  userProfile?: {
    name?: string;
    interests?: string[];
    strengths?: string[];
    weaknesses?: string[];
  };
}

// Helper function to generate UUID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// Mock AI response function (to be replaced with actual API call)
const getAIResponse = async (
  message: string,
  history: Message[],
  context: AIContext
): Promise<string> => {
  // In a real implementation, this would call your AI API
  // For now, we'll simulate a response based on keywords
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('goal') && lowerMessage.includes('create')) {
    return `I've created a new goal based on our conversation. You can see it in your goals panel on the right. What specific tasks would you like to add to this goal?`;
  }

  if (lowerMessage.includes('task') && lowerMessage.includes('add')) {
    return `I've added the new task to your goal. Is there anything else you'd like to add or modify?`;
  }

  if (lowerMessage.includes('analyze') || lowerMessage.includes('pattern')) {
    return `Based on your recent activities, I've noticed you tend to focus better in the morning. Would you like me to schedule more challenging tasks during your peak productivity hours?`;
  }

  if (lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
    return `I've developed a personalized plan for you based on your goals and past performance. Would you like me to walk you through it or make any adjustments?`;
  }

  return `I understand you want to discuss "${message}". How can I help you make progress on this topic? Would you like me to create a goal or suggest some tasks related to this?`;
};

// Hook for AI Assistant functionality
export const useAIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      content: 'Hello! I\'m your AI assistant. I can help you set goals and tasks, analyze patterns in your behavior, and create personalized plans. How can I help you today?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [context, setContext] = useState<AIContext>({
    goals: [],
    tasks: [],
    learningPreferences: [],
  });

  // Function to add a message from the user
  const addUserMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Get AI response
      const response = await getAIResponse(content, messages, context);

      // Analyze message for potential goals or tasks
      const updatedContext = analyzeUserMessage(content, context);
      setContext(updatedContext);

      // Add assistant response
      const assistantMessage: Message = {
        id: generateId(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);

      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, context]);

  // Function to analyze user message for potential goals and tasks
  const analyzeUserMessage = (message: string, currentContext: AIContext): AIContext => {
    const lowerMessage = message.toLowerCase();
    const newContext = { ...currentContext };

    // Example basic analysis for goals/tasks (would be much more sophisticated in a real implementation)
    if (lowerMessage.includes('goal') && lowerMessage.includes('create')) {
      // Extract potential goal title - simple implementation
      const goalTitle = message.replace(/create a goal/i, '').trim();

      if (goalTitle) {
        const newGoal: Goal = {
          id: generateId(),
          title: goalTitle.slice(0, 1).toUpperCase() + goalTitle.slice(1),
          description: 'Auto-generated based on conversation',
          status: 'pending',
          createdAt: new Date(),
        };

        newContext.goals = [...newContext.goals, newGoal];
      }
    }

    if (lowerMessage.includes('task') && lowerMessage.includes('add') && newContext.goals.length > 0) {
      // Simple task extraction - would be much more sophisticated in real implementation
      const taskTitle = message.replace(/add a task/i, '').trim();

      if (taskTitle) {
        const newTask: Task = {
          id: generateId(),
          goalId: newContext.goals[newContext.goals.length - 1].id, // Add to most recent goal
          title: taskTitle.slice(0, 1).toUpperCase() + taskTitle.slice(1),
          status: 'pending',
          createdAt: new Date(),
        };

        newContext.tasks = [...newContext.tasks, newTask];
      }
    }

    return newContext;
  };

  // Function to add a goal manually
  const addGoal = useCallback((title: string, description: string) => {
    const newGoal: Goal = {
      id: generateId(),
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    setContext(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));

    return newGoal;
  }, []);

  // Function to add a task to a goal
  const addTask = useCallback((goalId: string, title: string, description?: string) => {
    const newTask: Task = {
      id: generateId(),
      goalId,
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    setContext(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));

    return newTask;
  }, []);

  // Function to update a goal
  const updateGoal = useCallback((goalId: string, updates: Partial<Goal>) => {
    setContext(prev => ({
      ...prev,
      goals: prev.goals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    }));
  }, []);

  // Function to update a task
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setContext(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  }, []);

  // Function to delete a goal
  const deleteGoal = useCallback((goalId: string) => {
    setContext(prev => ({
      ...prev,
      goals: prev.goals.filter(goal => goal.id !== goalId),
      // Also remove associated tasks
      tasks: prev.tasks.filter(task => task.goalId !== goalId),
    }));
  }, []);

  // Function to delete a task
  const deleteTask = useCallback((taskId: string) => {
    setContext(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  }, []);

  // Function to generate a personalized plan
  const generatePersonalizedPlan = useCallback(() => {
    // Mock implementation - would call AI service in real implementation
    const newGoal = addGoal(
      'Improve productivity',
      'Focus on enhancing daily work efficiency and time management'
    );

    addTask(
      newGoal.id,
      'Install time-tracking app',
      'Select and install a suitable application for monitoring time usage'
    );

    addTask(
      newGoal.id,
      'Create morning routine',
      'Design a consistent morning workflow to start the day effectively'
    );

    addTask(
      newGoal.id,
      'Implement Pomodoro technique',
      'Use focused 25-minute work periods with 5-minute breaks'
    );

    return newGoal;
  }, [addGoal, addTask]);

  return {
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
  };
};

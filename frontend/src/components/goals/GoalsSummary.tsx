'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, ArrowRight } from 'lucide-react';
import { Goal } from './GoalsDashboard';
import { GoalProgress } from './GoalProgress';
import Link from 'next/link';

interface GoalsSummaryProps {
  goals: Goal[];
}

export function GoalsSummary({ goals }: GoalsSummaryProps) {
  // Ordenar las metas por prioridad y progreso
  const sortedGoals = [...goals].sort((a, b) => {
    // Primero por prioridad (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Luego por progreso (menor progreso primero)
    return a.progressPercentage - b.progressPercentage;
  });
  
  // Tomar las 3 metas más importantes
  const topGoals = sortedGoals.slice(0, 3);
  
  // Calcular el progreso general
  const overallProgress = goals.length > 0
    ? goals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / goals.length
    : 0;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Target className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Mis Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Progreso general
              </p>
              <GoalProgress percentage={overallProgress} />
              <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                {Math.round(overallProgress)}% completado
              </p>
            </div>
            
            <div className="space-y-3">
              {topGoals.map(goal => (
                <div key={goal.id} className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" 
                    style={{ 
                      backgroundColor: 
                        goal.priority === 'high' ? '#ef4444' : 
                        goal.priority === 'medium' ? '#f59e0b' : '#10b981' 
                    }} 
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {goal.title}
                    </p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 mt-1">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${goal.progressPercentage}%`,
                          backgroundColor: 
                            goal.progressPercentage < 25 ? '#ef4444' : 
                            goal.progressPercentage < 50 ? '#f59e0b' : 
                            goal.progressPercentage < 75 ? '#3b82f6' : '#10b981' 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {goal.progressPercentage}%
                  </span>
                </div>
              ))}
            </div>
            
            <Link 
              href="/dashboard/goals" 
              className="flex items-center justify-center text-sm text-indigo-600 dark:text-indigo-400 mt-4 hover:underline"
            >
              Ver todas las metas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </>
        ) : (
          <div className="text-center py-6">
            <Target className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No tienes metas establecidas
            </p>
            <Link 
              href="/dashboard/goals" 
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Crear tu primera meta
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
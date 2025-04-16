'use client';

import React from 'react';
import { Goal, GoalArea } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalAreaProgressProps {
  area: GoalArea;
  goals: Goal[];
}

const AREA_COLORS: Record<GoalArea, { bg: string; text: string; border: string }> = {
  'Desarrollo Personal': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500',
  },
  'Salud y Bienestar': {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500',
  },
  'Educación': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500',
  },
  'Finanzas': {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
  },
  'Hobbies': {
    bg: 'bg-pink-500/10',
    text: 'text-pink-500',
    border: 'border-pink-500',
  },
} as const;

export function GoalAreaProgress({ area, goals }: GoalAreaProgressProps) {
  // Filtrar metas por área
  const areaGoals = goals.filter(goal => goal.area === area);
  
  // Calcular totales
  const totalGoals = areaGoals.length;
  const completedGoals = areaGoals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = areaGoals.filter(goal => goal.status === 'active').length;
  const archivedGoals = areaGoals.filter(goal => goal.status === 'archived').length;
  
  // Calcular progreso considerando metas activas (50%) y completadas (100%)
  const activeAndCompletedGoals = inProgressGoals + completedGoals;
  const progress = activeAndCompletedGoals > 0
    ? Math.round(((completedGoals + (inProgressGoals * 0.5)) / activeAndCompletedGoals) * 100)
    : 0;
  
  const colors = AREA_COLORS[area];

  return (
    <div className={cn(
      'rounded-lg p-4',
      colors.bg,
    )}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={cn('font-medium', colors.text)}>{area}</h3>
        <span className={cn('text-sm', colors.text)}>
          {totalGoals} {totalGoals === 1 ? 'meta' : 'metas'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-black/5 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colors.bg.replace('/10', '')
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={colors.text}>{progress}% completado</span>
          <span className="text-muted-foreground">
            {completedGoals} de {activeAndCompletedGoals} completadas
          </span>
        </div>
      </div>
    </div>
  );
} 
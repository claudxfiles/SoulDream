'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitWithProgress {
  id: string;
  name: string;
  progress: number; // Represents streak for now
  last_completed?: string;
}

interface HabitsListCardProps {
  habits: HabitWithProgress[];
}

export function HabitsListCard({ habits }: HabitsListCardProps) {
  // Find the habit completed most recently today/yesterday
  const mostRecentlyCompleted = habits
      .filter(h => h.last_completed)
      .sort((a, b) => parseISO(b.last_completed!).getTime() - parseISO(a.last_completed!).getTime())[0];

  let completionMessage = "¡Sigue así!";
  let messageIcon = CheckCircle;
  let messageColor = "text-green-600 dark:text-green-400";

  if (mostRecentlyCompleted?.last_completed) {
      const timeAgo = formatDistanceToNow(parseISO(mostRecentlyCompleted.last_completed), { addSuffix: true, locale: es });
      completionMessage = `Hábito completado (${mostRecentlyCompleted.name}) ${timeAgo}. ¡Manteniendo la racha por ${mostRecentlyCompleted.progress} días consecutivos!`;
  } else if (habits.length > 0) {
      completionMessage = "Aún no has completado hábitos hoy. ¡Vamos!";
      messageIcon = XCircle;
      messageColor = "text-yellow-600 dark:text-yellow-400";
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Hábitos</CardTitle>
        <Link href="/dashboard/habits" className="text-xs text-muted-foreground hover:text-primary">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay hábitos definidos.</p>
        ) : (
          <ul className="space-y-4 mb-4">
            {habits.map((habit) => (
              <li key={habit.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium truncate" title={habit.name}>{habit.name}</p>
                  {/* Show streak if > 0 */}
                  {habit.progress > 0 && (
                     <span className="text-xs text-muted-foreground">{habit.progress} {habit.progress === 1 ? 'día' : 'días'}</span>
                  )}
                </div>
                {/* Progress bar shows completion, maybe weekly? Using placeholder value */}
                <Progress value={habit.progress * 10} className="h-2" indicatorClassName="bg-blue-500" />
              </li>
            ))}
          </ul>
        )}
        {/* Habit Completion Status Section (Example) */}
        {habits.length > 0 && (
          <div className={`mt-4 p-3 ${mostRecentlyCompleted ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'} rounded-lg flex items-start space-x-3`}>
            <messageIcon className={`h-5 w-5 ${messageColor} flex-shrink-0 mt-1`} />
            <div>
              <p className={`text-sm font-semibold ${mostRecentlyCompleted ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                {mostRecentlyCompleted ? 'Hábito completado' : 'Pendiente'}
              </p>
              <p className={`text-xs ${mostRecentlyCompleted ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                 {completionMessage}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
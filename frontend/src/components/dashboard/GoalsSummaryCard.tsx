'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  area: string;
  progress: number;
}

interface GoalsSummaryCardProps {
  goals: Goal[];
  className?: string;
}

export function GoalsSummaryCard({ goals, className }: GoalsSummaryCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Mis Metas</CardTitle>
        <Link href="/dashboard/goals" className="text-xs text-muted-foreground hover:text-primary">
          Ver todas las metas
        </Link>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay metas definidas.</p>
        ) : (
          <ul className="space-y-4">
            {goals.map((goal) => (
              <li key={goal.id}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium truncate" title={goal.title}>{goal.title}</p>
                  <span className="text-xs text-muted-foreground">{goal.progress}% completado</span>
                </div>
                <Progress value={goal.progress} className="h-2" indicatorClassName="bg-yellow-500" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 
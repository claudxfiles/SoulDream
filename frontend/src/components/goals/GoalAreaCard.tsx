'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Goal, GoalArea } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalAreaCardProps {
  area: GoalArea;
  goals: Goal[];
  isSelected?: boolean;
  onClick?: () => void;
}

const AREA_COLORS: Record<GoalArea, { bg: string; text: string }> = {
  'Desarrollo Personal': { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  'Salud y Bienestar': { bg: 'bg-green-500/10', text: 'text-green-500' },
  'Educación': { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  'Finanzas': { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  'Hobbies': { bg: 'bg-pink-500/10', text: 'text-pink-500' },
} as const;

export function GoalAreaCard({ area, goals, isSelected, onClick }: GoalAreaCardProps) {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'active').length;
  
  // Calculamos el progreso promedio de todas las metas del área
  const areaProgress = goals.length > 0
    ? goals.reduce((acc, goal) => {
        const goalProgress = ((goal.current_value || 0) / (goal.target_value || 100)) * 100;
        return acc + Math.min(goalProgress, 100);
      }, 0) / goals.length
    : 0;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        AREA_COLORS[area].bg,
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className={cn('font-semibold', AREA_COLORS[area].text)}>
            {area}
          </h3>
          <span className="text-sm text-muted-foreground">
            {totalGoals} {totalGoals === 1 ? 'meta' : 'metas'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={areaProgress} className="h-2" />
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Completadas</p>
              <p className="font-medium">{completedGoals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">En progreso</p>
              <p className="font-medium">{inProgressGoals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Progreso</p>
              <p className="font-medium">{Math.round(areaProgress)}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
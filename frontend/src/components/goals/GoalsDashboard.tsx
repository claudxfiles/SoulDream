'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/goals/useGoals';
import { Goal, GoalArea } from '@/types/goals';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalCard } from './GoalCard';
import { PlusIcon } from 'lucide-react';

const GOAL_AREAS: GoalArea[] = [
  'Desarrollo Personal',
  'Salud y Bienestar',
  'Educación',
  'Finanzas',
  'Hobbies',
];

export function GoalsDashboard() {
  const { goals, isLoading } = useGoals();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<'todas' | GoalArea>('todas');

  // Agrupar metas por área
  const goalsByArea = GOAL_AREAS.reduce((acc, area) => {
    acc[area] = goals?.filter(goal => goal.area === area) || [];
    return acc;
  }, {} as Record<GoalArea, Goal[]>);

  // Calcular progreso por área
  const areaProgress = GOAL_AREAS.reduce((acc, area) => {
    const areaGoals = goalsByArea[area];
    if (!areaGoals.length) return { ...acc, [area]: 0 };

    const totalProgress = areaGoals.reduce((sum, goal) => {
      const progress = (goal.current_value || 0) / (goal.target_value || 100) * 100;
      return sum + Math.min(progress, 100);
    }, 0);

    return { ...acc, [area]: Math.round(totalProgress / areaGoals.length) };
  }, {} as Record<GoalArea, number>);

  const filteredGoals = selectedArea === 'todas' 
    ? goals 
    : goals?.filter(goal => goal.area === selectedArea);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mis Metas</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-primary/90 hover:bg-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva Meta
        </Button>
      </div>

      {/* Tarjetas de áreas con progreso */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {GOAL_AREAS.map((area) => (
          <div
            key={area}
            className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/50 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">{area}</span>
              <span className="text-xs text-muted-foreground">
                {goalsByArea[area].length} {goalsByArea[area].length === 1 ? 'meta' : 'metas'}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${areaProgress[area]}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground text-right">
              {areaProgress[area]}% completado
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y lista de metas */}
      <Tabs defaultValue="todas" className="w-full" onValueChange={(value) => setSelectedArea(value as 'todas' | GoalArea)}>
        <TabsList className="bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          {GOAL_AREAS.map((area) => (
            <TabsTrigger key={area} value={area}>
              {area}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 space-y-4">
          {filteredGoals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {filteredGoals?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay metas en esta área. ¡Crea una nueva meta para comenzar!
            </div>
          )}
        </div>
      </Tabs>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={() => {}}
      />
    </div>
  );
} 
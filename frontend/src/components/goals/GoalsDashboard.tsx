'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/goals/useGoals';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalCard } from './GoalCard';
import { GoalAreaCard } from './GoalAreaCard';
import { GoalArea } from '@/types/goals';

const GOAL_AREAS: GoalArea[] = [
  'Desarrollo Personal',
  'Salud y Bienestar',
  'Educación',
  'Finanzas',
  'Hobbies',
];

export function GoalsDashboard() {
  const [selectedArea, setSelectedArea] = useState<GoalArea | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { goals, isLoading } = useGoals();

  const goalsByArea = GOAL_AREAS.reduce((acc, area) => {
    acc[area] = goals?.filter(goal => goal.area === area) || [];
    return acc;
  }, {} as Record<GoalArea, typeof goals>);

  const filteredGoals = selectedArea === 'all' 
    ? goals 
    : goals?.filter(goal => goal.area === selectedArea);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Mis Metas</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Meta
        </Button>
      </div>

      {/* Áreas de metas con barras de progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {GOAL_AREAS.map((area) => (
          <GoalAreaCard
            key={area}
            area={area}
            goals={goalsByArea[area] || []}
            isSelected={selectedArea === area}
            onClick={() => setSelectedArea(area === selectedArea ? 'all' : area)}
          />
        ))}
      </div>

      {/* Lista de metas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {selectedArea === 'all' ? 'Todas las metas' : selectedArea}
          </h3>
          <Button
            variant="ghost"
            onClick={() => setSelectedArea('all')}
            className={selectedArea === 'all' ? 'bg-muted' : ''}
          >
            Ver todas
          </Button>
        </div>

        {filteredGoals && filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {selectedArea === 'all'
              ? 'No hay metas creadas todavía.'
              : `No hay metas en el área de ${selectedArea}.`}
          </div>
        )}
      </div>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 
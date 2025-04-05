'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/goals/useGoals';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalCard } from './GoalCard';
import { GoalAreaProgress } from './GoalAreaProgress';
import { Plus } from 'lucide-react';
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

  const filteredGoals = selectedArea === 'all' 
    ? goals 
    : goals?.filter(goal => goal.area === selectedArea);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Metas</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {GOAL_AREAS.map((area) => (
          <GoalAreaProgress
            key={area}
            area={area}
            goals={goals || []}
            totalGoals={goals?.filter(g => g.area === area).length || 0}
          />
        ))}
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedArea(value as GoalArea | 'all')}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">
            Todas
          </TabsTrigger>
          {GOAL_AREAS.map((area) => (
            <TabsTrigger key={area} value={area}>
              {area}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredGoals && filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay metas definidas.
            </div>
          )}
        </TabsContent>

        {GOAL_AREAS.map((area) => (
          <TabsContent key={area} value={area} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredGoals && filteredGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay metas definidas para {area}.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 
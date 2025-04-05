'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoals } from '@/hooks/goals/useGoals';
import { GoalArea } from '@/types/goals';
import { GoalList } from './GoalList';
import { GoalDetails } from './GoalDetails';
import { CreateGoalDialog } from './CreateGoalDialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const AREAS: GoalArea[] = [
  'Desarrollo Personal',
  'Salud y Bienestar',
  'Educación',
  'Finanzas',
  'Hobbies'
];

export function GoalsDashboard() {
  const [selectedArea, setSelectedArea] = useState<GoalArea | 'all'>('all');
  const { goals, isLoading, selectedGoal } = useGoals();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredGoals = selectedArea === 'all' 
    ? goals 
    : goals?.filter(goal => goal.area === selectedArea);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Metas</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nueva Meta</span>
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1">
        <TabsList className="mb-4">
          <TabsTrigger value="all" onClick={() => setSelectedArea('all')}>
            Todas
          </TabsTrigger>
          {AREAS.map(area => (
            <TabsTrigger 
              key={area} 
              value={area}
              onClick={() => setSelectedArea(area)}
            >
              {area}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr,2fr]">
          <Card className="p-4">
            <GoalList goals={filteredGoals || []} />
          </Card>
          
          {selectedGoal && (
            <Card className="p-4">
              <GoalDetails goal={selectedGoal} />
            </Card>
          )}
        </div>
      </Tabs>

      <CreateGoalDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useGoals } from '@/hooks/goals/useGoals';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalCard } from './GoalCard';
import { GoalAreaProgress } from './GoalAreaProgress';
import { Plus } from 'lucide-react';
import { Goal, GoalArea } from '@/types/goals';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const activeGoals = goals?.filter(goal => goal.status === 'active') || [];
  const completedGoals = goals?.filter(goal => goal.status === 'completed') || [];
  const archivedGoals = goals?.filter(goal => goal.status === 'archived') || [];

  const filteredActiveGoals = selectedArea === 'all' 
    ? activeGoals 
    : activeGoals.filter(goal => goal.area === selectedArea);

  const filteredCompletedGoals = selectedArea === 'all'
    ? completedGoals
    : completedGoals.filter(goal => goal.area === selectedArea);

  const filteredArchivedGoals = selectedArea === 'all'
    ? archivedGoals
    : archivedGoals.filter(goal => goal.area === selectedArea);

  const handleCreateGoal = async (data: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-8">
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
            goals={activeGoals}
            totalGoals={activeGoals.filter(g => g.area === area).length || 0}
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

        <TabsContent value="all" className="mt-6 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredActiveGoals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredActiveGoals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay metas activas.
                  </div>
                )}
              </div>

              {filteredCompletedGoals.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="completed-goals">
                    <AccordionTrigger className="text-xl font-semibold">
                      Metas Completadas ({filteredCompletedGoals.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {filteredCompletedGoals.map((goal) => (
                          <GoalCard key={goal.id} goal={goal} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {filteredArchivedGoals.length > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="archived-goals">
                    <AccordionTrigger className="text-xl font-semibold">
                      Metas Archivadas ({filteredArchivedGoals.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {filteredArchivedGoals.map((goal) => (
                          <GoalCard key={goal.id} goal={goal} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          )}
        </TabsContent>

        {GOAL_AREAS.map((area) => (
          <TabsContent key={area} value={area} className="mt-6 space-y-8">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {filteredActiveGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredActiveGoals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay metas activas para {area}.
                    </div>
                  )}
                </div>

                {filteredCompletedGoals.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="completed-goals">
                      <AccordionTrigger className="text-xl font-semibold">
                        Metas Completadas ({filteredCompletedGoals.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                          {filteredCompletedGoals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {filteredArchivedGoals.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="archived-goals">
                      <AccordionTrigger className="text-xl font-semibold">
                        Metas Archivadas ({filteredArchivedGoals.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                          {filteredArchivedGoals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateGoal}
      />
    </div>
  );
} 
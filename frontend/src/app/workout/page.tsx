'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutCalendar } from '@/components/workout/WorkoutCalendar';
import WorkoutList from '@/components/workout/WorkoutList';

export default function WorkoutPage() {
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Workout</h1>
      <p className="text-muted-foreground mb-8">
        Registra tus entrenamientos y visualiza tu progreso físico
      </p>

      <Tabs defaultValue="historial" className="space-y-6">
        <TabsList>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="progreso">Progreso</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
        </TabsList>

        <TabsContent value="historial">
          <WorkoutList onRefresh={handleRefresh} key={`list-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="calendario">
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="progreso">
          {/* TODO: Implementar vista de progreso */}
          <div className="text-center py-12 text-muted-foreground">
            Vista de progreso en desarrollo
          </div>
        </TabsContent>

        <TabsContent value="planes">
          {/* TODO: Implementar vista de planes de entrenamiento */}
          <div className="text-center py-12 text-muted-foreground">
            Vista de planes de entrenamiento en desarrollo
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
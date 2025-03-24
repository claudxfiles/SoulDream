"use client";

import React from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle, LineChart, Settings } from 'lucide-react';
import { HabitStats } from '@/components/habits/HabitStats';
import HabitCalendarView from '@/components/habits/HabitCalendarView';
import HabitSettings from '@/components/habits/HabitSettings';

export default function HabitDetailPage({ params }: { params: { id: string } }) {
  // Obtener el ID del hábito de los parámetros de la ruta
  const habitId = params.id;
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Detalle del Hábito" 
        description="Visualiza y gestiona tu progreso en este hábito"
        icon={<CheckCircle className="h-6 w-6" />}
      />
      
      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Estadísticas</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progreso del Hábito</CardTitle>
              <CardDescription>
                Visualiza tu progreso y consistencia a lo largo del tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitStats habitId={habitId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Calendario</CardTitle>
              <CardDescription>
                Revisa y registra tu progreso diario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitCalendarView habitId={habitId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Hábito</CardTitle>
              <CardDescription>
                Ajusta la configuración y detalles de este hábito
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitSettings habitId={habitId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
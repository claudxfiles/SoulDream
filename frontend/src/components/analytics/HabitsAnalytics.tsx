'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useHabitsAnalytics } from "@/hooks/useHabitsAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { Activity, CheckCircle, Calendar } from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";

interface HabitStreak {
  habit_name: string;
  current_streak: number;
  best_streak: number;
  completion_rate: number;
}

interface DailyCompletion {
  date: string;
  completed_count: number;
  total_count: number;
  completion_rate: number;
}

interface HeatmapValue {
  date: string;
  count: number;
}

interface CalendarHeatmapProps {
  data: HeatmapValue[];
  colorScale?: string[];
}

// Colores del sistema de diseño
const PRIMARY_COLOR = '#4f46e5'; // Indigo
const SECONDARY_COLOR = '#10b981'; // Emerald
const ACCENT_COLOR = '#f59e0b'; // Amber

export function HabitsAnalytics() {
  const { data, isLoading, error } = useHabitsAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        Error al cargar los datos de hábitos
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { habit_streaks, daily_completions, completion_heatmap } = data;

  return (
    <div className="grid gap-6">
      {/* Rachas de Hábitos */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Rachas de Hábitos</CardTitle>
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            Actualizado hace menos de un minuto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habit_streaks} className="transition-all duration-300">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="habit_name" 
                  className="text-sm"
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  className="text-sm"
                  tick={{ fill: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="current_streak" 
                  name="Racha Actual" 
                  fill={PRIMARY_COLOR}
                  radius={[4, 4, 0, 0]}
                  className="transition-all duration-300 hover:opacity-80"
                />
                <Bar 
                  dataKey="best_streak" 
                  name="Mejor Racha" 
                  fill={SECONDARY_COLOR}
                  radius={[4, 4, 0, 0]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Completado Diario */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Completado Diario</CardTitle>
              <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily_completions}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'dd/MM')}
                    className="text-sm"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                    labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy')}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Hábitos Completados"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={3}
                    dot={{ fill: PRIMARY_COLOR, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                    className="transition-all duration-300"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mapa de Calor */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Mapa de Calor</CardTitle>
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <CalendarHeatmap
                data={completion_heatmap}
                colorScale={[
                  '#f1f5f9', // Slate 50 - Sin actividad
                  '#c7d2fe', // Indigo 200 - Baja actividad
                  '#818cf8', // Indigo 400 - Media actividad
                  '#4f46e5', // Indigo 600 - Alta actividad
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
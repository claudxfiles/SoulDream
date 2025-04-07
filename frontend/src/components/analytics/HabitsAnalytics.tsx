'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabitsAnalytics } from "@/hooks/useHabitsAnalytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";

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

// Colores del sistema de diseño
const PRIMARY_COLOR = '#4f46e5'; // Indigo
const SECONDARY_COLOR = '#10b981'; // Emerald
const ACCENT_COLOR = '#f59e0b'; // Amber

export function HabitsAnalytics() {
  const { data, isLoading, error } = useHabitsAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
    <div className="grid gap-4 md:grid-cols-2">
      {/* Rachas de Hábitos */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Rachas de Hábitos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actualizado hace menos de un minuto
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habit_streaks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="habit_name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="current_streak" 
                  name="Racha Actual" 
                  fill={PRIMARY_COLOR}
                />
                <Bar 
                  dataKey="best_streak" 
                  name="Mejor Racha" 
                  fill={SECONDARY_COLOR}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tasa de Completado Diario */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Completado Diario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos 30 días
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily_completions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  formatter={(value: number) => `${value}%`}
                  labelFormatter={(label) => new Date(label as string).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  stroke={ACCENT_COLOR}
                  name="Tasa de Completado"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de Calor de Completado */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor de Hábitos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actividad de los últimos 365 días
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
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
  );
} 
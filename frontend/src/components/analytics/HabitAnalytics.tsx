'use client';

import { Card } from "@/components/ui/card";
import { useHabitAnalytics } from "@/hooks/useHabitAnalytics";
import { Activity, TrendingUp, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_COLORS = {
  'Salud': '#10b981',      // Verde
  'Productividad': '#3b82f6', // Azul
  'Aprendizaje': '#f59e0b',   // Ámbar
  'Finanzas': '#6366f1',    // Índigo
  'Bienestar': '#ec4899',   // Rosa
  'Sin categoría': '#6b7280' // Gris
};

export function HabitAnalytics() {
  const { data, isLoading, error } = useHabitAnalytics();

  if (isLoading) return <div>Cargando análisis de hábitos...</div>;
  if (error) return <div>Error al cargar los datos de hábitos</div>;
  if (!data) return null;

  const categoryData = Object.entries(data.habits_by_category).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Mejora Semanal */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-sm font-medium">Mejora Semanal</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {data.improvement_percentage > 0 ? '+' : ''}{data.improvement_percentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              Has completado más hábitos esta semana que la semana pasada
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p>Esta semana</p>
                <p className="text-lg font-bold">{data.current_week_completions}</p>
              </div>
              <div>
                <p>Semana pasada</p>
                <p className="text-lg font-bold">{data.last_week_completions}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Rachas */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-sm font-medium">Rachas</h3>
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">{data.streak_data.current_streak} días</p>
            <p className="text-xs text-muted-foreground">Racha actual más larga</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p>Mejor racha</p>
                <p className="text-lg font-bold">{data.streak_data.best_streak} días</p>
              </div>
              <div>
                <p>Promedio</p>
                <p className="text-lg font-bold">{data.streak_data.average_streak} días</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Distribución por Categoría */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-sm font-medium">Distribución por Categoría</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['Sin categoría']} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center">
                  <div 
                    className="h-3 w-3 rounded-full mr-2" 
                    style={{ 
                      backgroundColor: CATEGORY_COLORS[category.name as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS['Sin categoría'] 
                    }} 
                  />
                  <span>{category.name}: {category.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Tendencia */}
      <Card className="p-6">
        <div className="flex items-center justify-between space-y-2">
          <h3 className="text-sm font-medium">Tendencia de Completitud</h3>
        </div>
        <div className="mt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.completion_trend}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(parseISO(date), 'dd/MM', { locale: es })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy', { locale: es })}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#4f46e5" 
                strokeWidth={2} 
                name="Completados"
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 
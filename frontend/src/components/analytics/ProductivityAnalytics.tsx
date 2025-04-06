'use client';

import { Card } from "@/components/ui/card";
import { useProductivityAnalytics } from "@/hooks/useProductivityAnalytics";
import { LineChart as LineChartIcon, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const PRIORITY_COLORS = {
  high: '#ef4444',   // Rojo para alta prioridad
  medium: '#f59e0b', // Ámbar para media prioridad
  low: '#10b981'     // Verde para baja prioridad
};

export function ProductivityAnalytics() {
  const { data, isLoading, error } = useProductivityAnalytics();

  if (isLoading) return <div>Cargando análisis de productividad...</div>;
  if (error) return <div>Error al cargar los datos de productividad</div>;
  if (!data) return null;

  const productivityChange = data.current_week_high_priority - data.last_week_high_priority;
  const productivityPercentage = data.last_week_high_priority > 0 
    ? Math.round((productivityChange / data.last_week_high_priority) * 100)
    : 100;

  const priorityData = [
    { name: 'Alta', value: data.tasks_by_priority.high },
    { name: 'Media', value: data.tasks_by_priority.medium },
    { name: 'Baja', value: data.tasks_by_priority.low }
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Card de Productividad */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-sm font-medium">Productividad</h3>
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {productivityPercentage > 0 ? '+' : ''}{productivityPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              Has completado más tareas de alta prioridad esta semana que la semana pasada
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p>Esta semana</p>
                <p className="text-lg font-bold">{data.current_week_high_priority}</p>
              </div>
              <div>
                <p>Semana pasada</p>
                <p className="text-lg font-bold">{data.last_week_high_priority}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Distribución de Tareas */}
        <Card className="p-6">
          <div className="flex items-center justify-between space-y-2">
            <h3 className="text-sm font-medium">Distribución de Tareas por Prioridad</h3>
          </div>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(PRIORITY_COLORS)[index]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: PRIORITY_COLORS.high }} />
                <span>Alta: {data.tasks_by_priority.high}%</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: PRIORITY_COLORS.medium }} />
                <span>Media: {data.tasks_by_priority.medium}%</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: PRIORITY_COLORS.low }} />
                <span>Baja: {data.tasks_by_priority.low}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Tendencia */}
      <Card className="p-6">
        <div className="flex items-center justify-between space-y-2">
          <h3 className="text-sm font-medium">Tareas Completadas</h3>
        </div>
        <div className="mt-4 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.tasks_completion_trend}>
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
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 
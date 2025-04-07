'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useProductivityAnalytics } from "@/hooks/useProductivityAnalytics";
import { LineChart as LineChartIcon, Wallet, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Card de Productividad */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Productividad</CardTitle>
              <LineChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-baseline">
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                  {productivityPercentage > 0 ? '+' : ''}{productivityPercentage}%
                </p>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs semana anterior</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Has completado más tareas de alta prioridad esta semana que la semana pasada
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Esta semana</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.current_week_high_priority}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Semana pasada</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.last_week_high_priority}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Distribución de Tareas */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Distribución de Tareas</CardTitle>
              <PieChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
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
                        className="transition-all duration-300 hover:opacity-80" 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {priorityData.map((item, index) => (
                <div key={item.name} className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: Object.values(PRIORITY_COLORS)[index] }} 
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendencia */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Tareas Completadas</CardTitle>
            <BarChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.tasks_completion_trend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(parseISO(date), 'dd/MM', { locale: es })}
                  className="text-sm"
                />
                <YAxis className="text-sm" />
                <Tooltip 
                  labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy', { locale: es })}
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
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                  className="transition-all duration-300"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
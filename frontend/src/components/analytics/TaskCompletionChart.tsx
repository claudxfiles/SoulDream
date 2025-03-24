"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TaskCompletionData } from '@/types/analytics';
import { AnalyticsCard } from './AnalyticsCard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCompletionChartProps {
  data: TaskCompletionData[];
  title?: string;
  description?: string;
  period: 'daily' | 'weekly' | 'monthly';
}

export function TaskCompletionChart({ 
  data, 
  title = 'Tareas Completadas', 
  description,
  period
}: TaskCompletionChartProps) {
  
  // Formatear fechas según el periodo
  const formattedData = data.map(item => {
    const date = new Date(item.date);
    let formattedDate = '';
    
    if (period === 'daily') {
      formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
    } else if (period === 'weekly') {
      formattedDate = `Sem ${Math.ceil(date.getDate() / 7)}`;
    } else {
      formattedDate = `${date.toLocaleString('es', { month: 'short' })}`;
    }
    
    return {
      ...item,
      formattedDate
    };
  });

  return (
    <AnalyticsCard 
      title={title} 
      description={description || `Actualizado ${formatDistanceToNow(new Date(), { addSuffix: true, locale: es })}`}
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="high" name="Alta" fill="#ef4444" />
            <Bar dataKey="medium" name="Media" fill="#f59e0b" />
            <Bar dataKey="low" name="Baja" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
} 
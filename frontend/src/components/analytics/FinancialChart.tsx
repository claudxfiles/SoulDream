"use client";

import React from 'react';
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell, Pie, PieChart } from 'recharts';
import { FinancialData } from '@/types/analytics';
import { AnalyticsCard } from './AnalyticsCard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FinancialChartProps {
  data: any[]; // Tipo genérico para admitir diferentes estructuras
  type: 'line' | 'bar' | 'pie';
  title?: string;
  description?: string;
  dataKeys: string[];
  colors?: string[];
}

export function FinancialChart({ 
  data,
  type,
  title = 'Datos Financieros', 
  description,
  dataKeys,
  colors = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#ec4899']
}: FinancialChartProps) {

  // Aseguramos que cada dataKey tenga un color
  const colorMap = dataKeys.reduce((acc, key, index) => {
    acc[key] = colors[index % colors.length];
    return acc;
  }, {} as Record<string, string>);

  const renderChartType = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map(key => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorMap[key]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map(key => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colorMap[key]} 
              />
            ))}
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKeys[0]}
              nameKey={dataKeys[1] || "name"}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
    }
  };

  return (
    <AnalyticsCard 
      title={title} 
      description={description || `Actualizado ${formatDistanceToNow(new Date(), { addSuffix: true, locale: es })}`}
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartType()}
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
} 
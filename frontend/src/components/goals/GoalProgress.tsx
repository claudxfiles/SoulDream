'use client';

import React from 'react';

interface GoalProgressProps {
  percentage: number;
}

export function GoalProgress({ percentage }: GoalProgressProps) {
  // Asegurar que el porcentaje esté entre 0 y 100
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  // Determinar el color de la barra de progreso basado en el porcentaje
  const getProgressColor = () => {
    if (safePercentage < 25) return 'bg-red-500';
    if (safePercentage < 50) return 'bg-yellow-500';
    if (safePercentage < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className={`h-2.5 rounded-full ${getProgressColor()}`} 
        style={{ width: `${safePercentage}%` }}
      ></div>
    </div>
  );
} 
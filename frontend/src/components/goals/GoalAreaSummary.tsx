'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { GoalProgress } from './GoalProgress';

interface GoalAreaSummaryProps {
  area: string;
  icon: React.ReactNode;
  name: string;
  count: number;
  progress: number;
}

export function GoalAreaSummary({ area, icon, name, count, progress }: GoalAreaSummaryProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center mb-3">
        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 mr-3">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {count} {count === 1 ? 'meta' : 'metas'}
          </p>
        </div>
      </div>
      <GoalProgress percentage={progress} />
      <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
        {Math.round(progress)}% completado
      </p>
    </Card>
  );
} 
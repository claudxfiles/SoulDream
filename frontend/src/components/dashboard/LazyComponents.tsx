'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Componente de carga compartido
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
  </div>
);

// Lazy loading del menú de perfil
export const LazyUserProfileMenu = dynamic(
  () => import('./UserProfileMenu').then(mod => mod.UserProfileMenu),
  {
    loading: () => (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
    ),
    ssr: false,
  }
);

export const LazyFinanceDashboard = dynamic(
  () => import('../finance/FinanceDashboard').then(mod => mod.FinanceDashboard),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyAIAssistant = dynamic(
  () => import('../ai-chat/AiChatInterface').then(mod => mod.AiChatInterface),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyTasksBoard = dynamic(
  () => import('../tasks/TaskBoard').then(mod => mod.TaskBoard),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyGoalsList = dynamic(
  () => import('../goals/GoalsList').then(mod => mod.GoalsList),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// Wrapper para componentes Suspense con cacheo mejorado
export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
} 
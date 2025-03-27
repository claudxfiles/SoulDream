"use client";

import React from 'react';
import HabitDetails from '@/components/habits/HabitDetails';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Crear un cliente de consulta
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface HabitDetailsPageProps {
  params: {
    id: string;
  };
}

export default function HabitDetailsPage({ params }: HabitDetailsPageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container max-w-4xl mx-auto py-8">
        <HabitDetails habitId={params.id} />
      </div>
    </QueryClientProvider>
  );
} 
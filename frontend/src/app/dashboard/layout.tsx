'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TasksProvider } from '@/providers/TasksProvider';
import { AuthProvider } from '@/providers/AuthProvider';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TasksProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </TasksProvider>
    </AuthProvider>
  );
} 
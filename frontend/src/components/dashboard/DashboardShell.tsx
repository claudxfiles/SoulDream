'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="container mx-auto py-6">
      {children}
    </div>
  );
} 
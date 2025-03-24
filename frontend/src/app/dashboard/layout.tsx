'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 
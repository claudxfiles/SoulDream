'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AiChatInterface } from '@/components/ai-chat/AiChatInterface';
import { TasksProvider } from '@/providers/TasksProvider';

export default function AiChatPage() {
  return (
    <DashboardLayout>
      <TasksProvider>
        <div className="h-[calc(100vh-10rem)]">
          <AiChatInterface />
        </div>
      </TasksProvider>
    </DashboardLayout>
  );
} 
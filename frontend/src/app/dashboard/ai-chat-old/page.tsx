'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AiChatInterface } from '@/components/ai-chat/AiChatInterface';

export default function AiChatPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)]">
        <AiChatInterface />
      </div>
    </DashboardLayout>
  );
} 
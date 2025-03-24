'use client';

import { ReactNode } from 'react';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar';

interface CalendarStatusWrapperProps {
  children: (isConnected: boolean) => ReactNode;
}

export function CalendarStatusWrapper({ children }: CalendarStatusWrapperProps) {
  const { isConnected } = useGoogleCalendarStatus();
  return <>{children(isConnected)}</>;
} 
"use client";

import React from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';
import { HabitStreakData } from '@/types/analytics';
import { AnalyticsCard } from './AnalyticsCard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitStreakCalendarProps {
  data: HabitStreakData[];
  title?: string;
  description?: string;
  year?: number;
}

export function HabitStreakCalendar({
  data,
  title = 'Calendario de Hábitos',
  description,
  year = new Date().getFullYear()
}: HabitStreakCalendarProps) {
  // Transformar los datos al formato que espera el componente de calendario
  const calendarData = data.map(streak => ({
    day: streak.date,
    value: streak.streak
  }));

  // Calcular el rango de fechas para el calendario
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  return (
    <AnalyticsCard
      title={title}
      description={description || `Actualizado ${formatDistanceToNow(new Date(), { addSuffix: true, locale: es })}`}
    >
      <div className="h-80 w-full">
        <ResponsiveCalendar
          data={calendarData}
          from={from}
          to={to}
          emptyColor="#eeeeee"
          colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'row',
              translateY: 36,
              itemCount: 4,
              itemWidth: 42,
              itemHeight: 36,
              itemsSpacing: 14,
              itemDirection: 'right-to-left'
            }
          ]}
        />
      </div>
    </AnalyticsCard>
  );
} 
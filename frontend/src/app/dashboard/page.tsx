'use client';

import React from 'react';
import { 
  DollarSign, 
  Target,
  TrendingUp,
  Clock,
  Loader2,
  CheckSquare,
  Calendar as CalendarIcon,
  ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';

import { UpcomingTasksCard } from '@/components/dashboard/UpcomingTasksCard';
import { GoalsSummaryCard } from '@/components/dashboard/GoalsSummaryCard';
import { CalendarDayCard } from '@/components/dashboard/CalendarDayCard';
import { FinanceSummaryCard } from '@/components/dashboard/FinanceSummaryCard';
import { HabitsListCard } from '@/components/dashboard/HabitsListCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FinanceOverviewCard } from '@/components/dashboard/FinanceOverviewCard';

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData();
  const { user } = useAuth();

  if (error) {
    return (
      <div className="p-4 lg:p-8 text-red-600">
        Error al cargar los datos: {error.message}
      </div>
    );
  }

  const safeData = data || {
    goalsProgress: 0,
    topHabit: { name: '...', streak: 0 },
    finances: { balance: 0, monthlyChange: 0, income: 0, fixedExpenses: 0, variableExpenses: 0, savings: 0 },
    nextEvent: null,
    upcomingTasks: [],
    goalsList: [],
    todayEvents: [],
    habitsList: [],
  };

  const monthlyChange = safeData.finances.monthlyChange;
  const isPositiveChange = monthlyChange >= 0;

  const pendingTasksCount = safeData.upcomingTasks.length;
  const todayEventsCount = safeData.todayEvents.length;
  const habitStreak = safeData.topHabit.streak;
  const financialBalance = safeData.finances.balance;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">SoulDream Dashboard</h1>
            {user && <p className="text-gray-600 dark:text-gray-300 mt-2">Hola, {user.user_metadata?.full_name || user.email}!</p>}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-2 mt-4 md:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">TAREAS PENDIENTES</CardTitle>
                <ListChecks className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasksCount}</div>
                <p className="text-xs text-muted-foreground/80">+2 desde ayer (ejemplo)</p>
              </CardContent>
            </Card>
            <Card className="group transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">EVENTOS HOY</CardTitle>
                <CalendarIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayEventsCount}</div>
                <p className="text-xs text-muted-foreground/80">1 reunión importante (ejemplo)</p>
              </CardContent>
            </Card>
            <Card className="group transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">BALANCE (MES)</CardTitle>
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${financialBalance.toLocaleString()}</div>
                <p className={`text-xs ${isPositiveChange ? 'text-green-600/90' : 'text-red-600/90'}`}> {isPositiveChange ? '+' : ''}{Math.round(monthlyChange)}% este mes</p>
              </CardContent>
            </Card>
            <Card className="group transition-transform duration-200 ease-in-out hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">STREAK DE HÁBITOS</CardTitle>
                <TrendingUp className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">{habitStreak} {habitStreak === 1 ? 'día' : 'días'} {habitStreak > 0 && <span className="ml-1">🔥</span>}</div>
                <p className="text-xs text-muted-foreground/80">Mejor racha: {data.topHabit.streak} días (ejemplo)</p>
              </CardContent>
            </Card>
          </div>

          <FinanceOverviewCard finances={safeData.finances} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <UpcomingTasksCard tasks={safeData.upcomingTasks} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
              <CalendarDayCard events={safeData.todayEvents} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <GoalsSummaryCard goals={safeData.goalsList} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
              <HabitsListCard habits={safeData.habitsList} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
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
import { useCalendarEvents } from '@/hooks/useGoogleCalendar';

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
  
  // Obtener eventos del calendario para hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { 
    data: calendarEvents = [], 
    isLoading: isLoadingCalendar 
  } = useCalendarEvents(today, tomorrow);

  // Obtener el próximo evento (el más cercano a la hora actual)
  const now = new Date();
  const nextEvent = calendarEvents
    .filter(event => new Date(event.start) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error al cargar los datos: {error.message}
      </div>
    );
  }

  const monthlyChange = data?.finances?.monthlyChange || 0;
  const isPositiveChange = monthlyChange >= 0;

  const pendingTasksCount = data?.upcomingTasks.length || 0;
  const todayEventsCount = data?.todayEvents.length || 0;
  const habitStreak = data?.topHabit.streak || 0;
  const financialBalance = data?.finances.balance || 0;

  return (
    <div className="p-4">
      {/* Hero Dashboard Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">SoulDream Dashboard</h1>
            {user && <p className="text-gray-600 dark:text-gray-300 mt-2">Bienvenido de nuevo, {user.user_metadata?.full_name || user.email}! Aquí está el resumen de tu progreso.</p>}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-2 mt-4 md:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-4 flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Progress overview cards */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PROGRESO DE METAS</p>
                    <h3 className="text-xl font-bold mt-1">{data?.goalsProgress}%</h3>
                  </div>
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${data?.goalsProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">HÁBITO DESTACADO</p>
                    <h3 className="text-lg font-bold mt-1">{data?.topHabit.name}</h3>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {data?.topHabit.streak} días consecutivos
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">FINANZAS</p>
                    <h3 className="text-xl font-bold mt-1">${financialBalance.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${isPositiveChange ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                  <p className={`text-sm ${isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositiveChange ? '+' : ''}{Math.round(monthlyChange)}% este mes
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PRÓXIMO EVENTO</p>
                    <h3 className="text-lg font-bold mt-1">
                      {isLoadingCalendar ? 'Cargando...' : nextEvent?.title || 'No hay eventos próximos'}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {nextEvent ? format(new Date(nextEvent.start), 'HH:mm', { locale: es }) : '-'}
                  </p>
                </div>
              </div>
            </>
          )}
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

          <FinanceOverviewCard finances={data.finances} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <UpcomingTasksCard tasks={data.upcomingTasks} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
              <CalendarDayCard events={data.todayEvents} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <GoalsSummaryCard goals={data.goalsList} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
              <HabitsListCard habits={data.habitsList} className="transition-transform duration-200 ease-in-out hover:scale-[1.02]"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
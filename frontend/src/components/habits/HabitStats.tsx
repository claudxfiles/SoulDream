'use client';

import React, { useMemo } from 'react';
import { Habit } from '@/types/habit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Target, Award, Zap, Loader2, AlertCircle, Calendar, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGetHabitById, useGetHabitLogs } from '@/hooks/useHabits';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// Propiedades para la vista de un solo hábito
interface SingleHabitStatsProps {
  habitId: string;
  habits?: never;
}

// Propiedades para la vista de resumen de todos los hábitos
interface MultipleHabitStatsProps {
  habitId?: never;
  habits: Habit[];
}

// Tipo unión para cualquier caso
type HabitStatsProps = SingleHabitStatsProps | MultipleHabitStatsProps;

export function HabitStats(props: HabitStatsProps) {
  // Si se proporciona habitId, mostrar estadísticas de un solo hábito
  if ('habitId' in props && props.habitId) {
    return <SingleHabitStats habitId={props.habitId} />;
  }
  
  // Si se proporciona habits, mostrar estadísticas generales
  if ('habits' in props && props.habits) {
    return <MultipleHabitsStats habits={props.habits} />;
  }
  
  // Caso por defecto si no se proporciona ninguno
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>No hay datos</AlertTitle>
      <AlertDescription>
        No hay información disponible para mostrar estadísticas.
      </AlertDescription>
    </Alert>
  );
}

// Componente para mostrar estadísticas de un solo hábito
function SingleHabitStats({ habitId }: { habitId: string }) {
  // Obtener datos del hábito y sus registros
  const { data: habit, isLoading: isLoadingHabit, error: habitError } = useGetHabitById(habitId);
  const { data: habitLogs, isLoading: isLoadingLogs, error: logsError } = useGetHabitLogs(habitId);
  
  // Si está cargando, mostrar indicador
  if (isLoadingHabit || isLoadingLogs) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Si hay un error, mostrar mensaje
  if (habitError || logsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la información del hábito o sus registros.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Calcular estadísticas
  const totalLogs = habitLogs?.length || 0;
  const today = new Date();
  const thisMonth = startOfMonth(today);
  const daysInThisMonth = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today)
  });
  
  // Filtrar logs de este mes
  const logsThisMonth = habitLogs?.filter(log => {
    const logDate = new Date(log.completed_date);
    return logDate >= thisMonth && logDate <= today;
  }) || [];
  
  // Calcular tasa de completado (dias completados / dias transcurridos este mes)
  const daysPassed = Math.min(daysInThisMonth.length, today.getDate());
  const completionRate = daysPassed > 0 ? (logsThisMonth.length / daysPassed) * 100 : 0;
  
  // Generar datos para el gráfico de calendario
  const calendarData = daysInThisMonth.map(day => {
    const isCompleted = habitLogs?.some(log => 
      isSameDay(new Date(log.completed_date), day)
    ) || false;
    
    return {
      date: day,
      isCompleted,
    };
  });
  
  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Racha actual" 
          value={`${habit?.current_streak || 0} días`}
          icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          description="Días consecutivos completados"
        />
        <StatCard 
          title="Mejor racha" 
          value={`${habit?.best_streak || 0} días`}
          icon={<Award className="h-5 w-5 text-yellow-500" />}
          description="Tu récord histórico"
        />
        <StatCard 
          title="Este mes" 
          value={`${logsThisMonth.length}/${daysPassed} días`}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          description={`${completionRate.toFixed(0)}% de completado`}
        />
      </div>
      
      {/* Barra de progreso mensual */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progreso este mes</span>
          <span className="font-medium">{completionRate.toFixed(0)}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>
      
      {/* Gráfico de calendario mensual */}
      <div className="pt-4">
        <h3 className="text-sm font-medium mb-3">
          {format(thisMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {/* Encabezados de días */}
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
          
          {/* Días del mes con relleno inicial */}
          {Array.from({ length: getFirstDayOfMonthOffset(thisMonth) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Días del mes */}
          {calendarData.map((day, i) => (
            <div 
              key={i}
              className={`aspect-square rounded-full flex items-center justify-center text-xs
                ${day.isCompleted 
                  ? 'bg-green-100 text-green-800 font-medium' 
                  : day.date <= today 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'text-gray-300'
                }
              `}
            >
              {day.date.getDate()}
            </div>
          ))}
        </div>
      </div>
      
      {/* Consejo o motivación */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          {habit?.current_streak === 0 
            ? "¡Comienza hoy para construir tu racha!" 
            : habit?.current_streak && habit.current_streak > 7
              ? "¡Excelente constancia! Mantén el impulso."
              : "¡Sigue así! La constancia es clave para formar hábitos."}
        </p>
      </div>
    </div>
  );
}

// Componente para mostrar estadísticas de todos los hábitos
function MultipleHabitsStats({ habits }: { habits: Habit[] }) {
  const today = new Date();
  const thisMonth = startOfMonth(today);
  
  // Calcular estadísticas globales
  const currentStreak = useMemo(() => {
    const streaks = habits.map(habit => habit.current_streak || 0);
    return streaks.length > 0 ? Math.max(...streaks) : 0;
  }, [habits]);
  
  const bestStreak = useMemo(() => {
    const streaks = habits.map(habit => habit.best_streak || 0);
    return streaks.length > 0 ? Math.max(...streaks) : 0;
  }, [habits]);
  
  // Calcular tasa de completado del mes (simulado)
  const completionRate = 0; // En una implementación real, calcular con los logs
  
  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Resumen de estadísticas */}
            <div className="grid grid-cols-1 gap-4">
              <StatCard 
                title="Racha actual" 
                value={`${currentStreak} días`}
                icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
                description="Tu mejor racha activa"
              />
              <StatCard 
                title="Mejor racha" 
                value={`${bestStreak} días`}
                icon={<Award className="h-5 w-5 text-yellow-500" />}
                description="Tu récord histórico"
              />
              <StatCard 
                title="Este mes" 
                value={`${completionRate.toFixed(0)}% completado`}
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
                description="Progreso mensual"
              />
            </div>
            
            {/* Mensaje motivacional */}
            <div className="text-sm text-muted-foreground pt-2">
              <p>
                {habits.length === 0 
                  ? "Crea tu primer hábito para comenzar a registrar tu progreso."
                  : currentStreak === 0
                    ? "¡Comienza hoy para construir tu racha!" 
                    : currentStreak > 7
                      ? "¡Excelente constancia! Mantén el impulso."
                      : "¡Sigue así! La constancia es clave para formar hábitos."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de tarjeta para estadísticas
function StatCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Función auxiliar para calcular el offset del primer día del mes (para el grid de calendario)
function getFirstDayOfMonthOffset(date: Date): number {
  const firstDayOfMonth = startOfMonth(date);
  let dayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo, 1 = lunes, etc.
  
  // Convertir a formato donde lunes es el primer día (0) y domingo es el último (6)
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
} 
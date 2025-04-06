import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { format, startOfWeek, endOfWeek, subWeeks, parseISO } from 'date-fns';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Fechas para comparación
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const currentWeekEnd = endOfWeek(now);
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));

    // Obtener completados esta semana
    const { data: currentWeekData, error: currentWeekError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .gte('completed_date', format(currentWeekStart, 'yyyy-MM-dd'))
      .lte('completed_date', format(currentWeekEnd, 'yyyy-MM-dd'))
      .eq('user_id', user?.id);

    if (currentWeekError) throw currentWeekError;

    // Obtener completados semana pasada
    const { data: lastWeekData, error: lastWeekError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .gte('completed_date', format(lastWeekStart, 'yyyy-MM-dd'))
      .lte('completed_date', format(lastWeekEnd, 'yyyy-MM-dd'))
      .eq('user_id', user?.id);

    if (lastWeekError) throw lastWeekError;

    // Obtener hábitos por categoría
    const { data: habitsByCategory, error: categoryError } = await supabase
      .from('habits')
      .select('category')
      .eq('user_id', user?.id)
      .eq('is_active', true);

    if (categoryError) throw categoryError;

    // Calcular estadísticas
    const currentWeekCompletions = currentWeekData.length;
    const lastWeekCompletions = lastWeekData.length;
    const improvementPercentage = lastWeekCompletions === 0 
      ? 100 
      : Math.round(((currentWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100);

    // Agrupar hábitos por categoría
    const categoryCount = habitsByCategory.reduce((acc, habit) => {
      const category = habit.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Obtener tendencia de completitud
    const { data: trendData, error: trendError } = await supabase
      .from('habit_logs')
      .select('completed_date, habit_id')
      .eq('user_id', user?.id)
      .gte('completed_date', format(subWeeks(now, 2), 'yyyy-MM-dd'))
      .order('completed_date', { ascending: true });

    if (trendError) throw trendError;

    // Agrupar completitudes por fecha
    const completionTrend = trendData.reduce((acc, log) => {
      const date = format(parseISO(log.completed_date), 'yyyy-MM-dd');
      const existingDay = acc.find(d => d.date === date);
      if (existingDay) {
        existingDay.completed += 1;
      } else {
        acc.push({ date, completed: 1, total: Object.values(categoryCount).reduce((a, b) => a + b, 0) });
      }
      return acc;
    }, [] as Array<{ date: string; completed: number; total: number }>);

    // Obtener mejor categoría
    const bestCategory = Object.entries(categoryCount).reduce((a, b) => 
      (categoryCount[a[0]] || 0) > (categoryCount[b[0]] || 0) ? a : b
    )[0];

    // Obtener datos de racha
    const { data: streakData, error: streakError } = await supabase
      .from('habits')
      .select('current_streak, best_streak')
      .eq('user_id', user?.id)
      .eq('is_active', true);

    if (streakError) throw streakError;

    const averageStreak = streakData.reduce((acc, habit) => acc + (habit.current_streak || 0), 0) / 
      (streakData.length || 1);

    const maxCurrentStreak = Math.max(...streakData.map(h => h.current_streak || 0));
    const maxBestStreak = Math.max(...streakData.map(h => h.best_streak || 0));

    return NextResponse.json({
      current_week_completions: currentWeekCompletions,
      last_week_completions: lastWeekCompletions,
      improvement_percentage: improvementPercentage,
      habits_by_category: categoryCount,
      completion_trend: completionTrend,
      total_active_habits: Object.values(categoryCount).reduce((a, b) => a + b, 0),
      best_performing_category: bestCategory,
      streak_data: {
        current_streak: maxCurrentStreak,
        best_streak: maxBestStreak,
        average_streak: Math.round(averageStreak)
      }
    });

  } catch (error) {
    console.error('Error en analytics/habits:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis de hábitos' },
      { status: 500 }
    );
  }
} 
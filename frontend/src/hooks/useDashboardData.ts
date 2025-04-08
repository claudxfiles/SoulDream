import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Goal {
  id: string;
  title: string;
  area: string;
}

interface GoalStep {
  id: string;
  goal_id: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface AreaProgress {
  goals: (Goal & { progress: number })[];
  totalSteps: number;
  completedSteps: number;
}

interface AreaProgressMap {
  [key: string]: AreaProgress;
}

interface DashboardData {
  goalsProgress: number;
  topHabit: {
    name: string;
    streak: number;
  };
  finances: {
    balance: number;
    monthlyChange: number;
  };
  nextEvent: {
    title: string;
    time: string;
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // First check if we have an authenticated user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user');
        }

        const userId = session.user.id;

        // Obtener metas activas del usuario
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('id, title, area')
          .eq('user_id', userId);
        
        if (goalsError) {
          console.error('Error fetching goals:', goalsError);
          throw goalsError;
        }

        // Obtener los pasos de todas las metas
        const { data: steps, error: stepsError } = await supabase
          .from('goal_steps')
          .select('id, goal_id, status')
          .in('goal_id', goals?.map(g => g.id) || []);

        if (stepsError) {
          console.error('Error fetching goal steps:', stepsError);
          throw stepsError;
        }

        // Agrupar los pasos por área y calcular progreso
        const goalsByArea = (goals as Goal[])?.reduce<AreaProgressMap>((acc, goal) => {
          if (!acc[goal.area]) {
            acc[goal.area] = { goals: [], totalSteps: 0, completedSteps: 0 };
          }
          const goalSteps = (steps as GoalStep[])?.filter(step => step.goal_id === goal.id) || [];
          const completedSteps = goalSteps.filter(step => step.status === 'completed').length;
          
          acc[goal.area].goals.push({
            ...goal,
            progress: goalSteps.length > 0 ? (completedSteps / goalSteps.length) * 100 : 0
          });
          acc[goal.area].totalSteps += goalSteps.length;
          acc[goal.area].completedSteps += completedSteps;
          
          return acc;
        }, {});

        // Calcular el progreso promedio total
        const areas = Object.values(goalsByArea || {});
        const totalProgress = areas.length > 0
          ? areas.reduce((acc, area) => {
              const areaProgress = area.totalSteps > 0 
                ? (area.completedSteps / area.totalSteps) * 100 
                : 0;
              return acc + areaProgress;
            }, 0) / areas.length
          : 0;

        // Obtener hábitos
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id, title')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (habitsError) {
          console.error('Error fetching habits:', habitsError);
          throw habitsError;
        }

        // Obtener logs para los hábitos
        const habitIds = habits?.map(h => h.id) || [];
        const { data: habitLogs, error: logsError } = await supabase
          .from('habit_logs')
          .select('habit_id, completed_date, value')
          .in('habit_id', habitIds)
          .order('completed_date', { ascending: false });

        if (logsError) {
          console.error('Error fetching habit logs:', logsError);
          throw logsError;
        }

        // Combinar hábitos con sus logs
        const habitsWithLogs = habits?.map(habit => ({
          ...habit,
          name: habit.title,
          habit_logs: habitLogs?.filter(log => log.habit_id === habit.id) || []
        }));

        // Calcular racha para cada hábito
        const habitsWithStreaks = habitsWithLogs?.map(habit => {
          const logs = habit.habit_logs || [];
          const completedLogs = logs
            .filter(log => log.value > 0)
            .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());

          let streak = 0;
          if (completedLogs.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let currentDate = new Date(completedLogs[0].completed_date);
            currentDate.setHours(0, 0, 0, 0);

            // Si el último log no es de hoy o ayer, no hay racha activa
            const diffDays = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 1) {
              streak = 1;
              
              // Contar días consecutivos hacia atrás
              for (let i = 1; i < completedLogs.length; i++) {
                const prevDate = new Date(completedLogs[i].completed_date);
                prevDate.setHours(0, 0, 0, 0);
                
                const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                  streak++;
                  currentDate = prevDate;
                } else {
                  break;
                }
              }
            }
          }

          return {
            name: habit.name,
            streak
          };
        }) || [];

        // Obtener el hábito con la racha más larga
        const topHabit = habitsWithStreaks.reduce((max, habit) => 
          habit.streak > max.streak ? habit : max, 
          { name: 'No habits yet', streak: 0 }
        );

        // Obtener balance financiero
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

        // Obtener todas las transacciones del mes actual
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', firstDayOfMonth.toISOString())
          .lte('date', currentDate.toISOString());

        if (transactionsError) throw transactionsError;

        // Calcular ingresos y gastos
        const monthlyIncome = transactions
          ?.filter(t => t.type.toLowerCase() === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const monthlyExpenses = transactions
          ?.filter(t => t.type.toLowerCase() === 'expense')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

        // Obtener gastos de suscripciones
        const { data: subscriptions_tracker } = await supabase
          .from('subscriptions_tracker')
          .select('amount')
          .eq('user_id', userId)
          .eq('status', 'active');

        const subscriptionExpenses = subscriptions_tracker
          ?.reduce((sum, sub) => sum + Number(sub.amount), 0) || 0;

        const currentBalance = monthlyIncome - (monthlyExpenses + subscriptionExpenses);

        // Calcular el cambio porcentual respecto al mes anterior
        const monthlyChange = monthlyIncome > 0 
          ? ((monthlyIncome - (monthlyExpenses + subscriptionExpenses)) / monthlyIncome) * 100 
          : 0;

        // Obtener próximo evento
        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select('title, start_time')
          .eq('user_id', userId)
          .gte('start_time', new Date().toISOString())
          .order('start_time')
          .limit(1);

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw eventsError;
        }

        setData({
          goalsProgress: Math.round(totalProgress),
          topHabit: {
            name: topHabit.name,
            streak: topHabit.streak,
          },
          finances: {
            balance: currentBalance,
            monthlyChange: Math.round(monthlyChange),
          },
          nextEvent: {
            title: events?.[0]?.title || 'No upcoming events',
            time: events?.[0]?.start_time ? new Date(events[0].start_time).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }) : '-',
          },
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return { data, loading, error };
} 
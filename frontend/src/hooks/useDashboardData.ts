import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

        // Obtener progreso de metas activas
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('current_value, target_value')
          .eq('user_id', userId)
          .neq('status', 'completed');
        
        if (goalsError) {
          console.error('Error fetching goals:', goalsError);
          throw goalsError;
        }

        // Calcular el progreso promedio de las metas
        const averageProgress = goals?.reduce((acc, goal) => {
          if (goal.target_value && goal.target_value > 0) {
            const progress = (goal.current_value || 0) / goal.target_value * 100;
            return acc + progress;
          }
          return acc;
        }, 0) / (goals?.length || 1);

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
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('user_id', userId)
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          throw transactionsError;
        }

        const balance = transactions?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0;
        const previousBalance = transactions?.reduce((acc, tx) => {
          if (new Date(tx.created_at).getMonth() === new Date().getMonth() - 1) {
            return acc + (tx.amount || 0);
          }
          return acc;
        }, 0) || 0;

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
          goalsProgress: Math.round(averageProgress),
          topHabit: {
            name: topHabit.name,
            streak: topHabit.streak,
          },
          finances: {
            balance,
            monthlyChange: previousBalance ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100 : 0,
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
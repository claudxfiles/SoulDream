import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { differenceInDays, endOfDay, format, startOfDay, startOfMonth } from 'date-fns';

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

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  description?: string;
}

interface FinancialSummary {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  savings: number;
  balance: number;
  monthlyChange: number;
}

interface HabitWithProgress {
  id: string;
  name: string;
  progress: number;
  last_completed?: string;
}

interface DashboardData {
  goalsProgress: number;
  topHabit: {
    name: string;
    streak: number;
  };
  finances: FinancialSummary;
  nextEvent: {
    title: string;
    time: string;
  } | null;
  upcomingTasks: Task[];
  goalsList: (Goal & { progress: number })[];
  todayEvents: CalendarEvent[];
  habitsList: HabitWithProgress[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('No authenticated user');
        }
        const userId = session.user.id;
        const now = new Date();

        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, title, area, status')
          .eq('user_id', userId)
          .neq('status', 'archived');
        
        if (goalsError) throw goalsError;
        const goals: Goal[] = goalsData || [];

        const { data: stepsData, error: stepsError } = await supabase
          .from('goal_steps')
          .select('id, goal_id, status')
          .in('goal_id', goals.map(g => g.id));

        if (stepsError) throw stepsError;
        const steps: GoalStep[] = stepsData || [];

        const goalsWithProgress = goals.map(goal => {
          const goalSteps = steps.filter(step => step.goal_id === goal.id);
          const completedSteps = goalSteps.filter(step => step.status === 'completed').length;
          return {
            ...goal,
            progress: goalSteps.length > 0 ? Math.round((completedSteps / goalSteps.length) * 100) : 0,
          };
        });

        const totalSteps = steps.length;
        const totalCompletedSteps = steps.filter(step => step.status === 'completed').length;
        const overallGoalsProgress = totalSteps > 0 ? Math.round((totalCompletedSteps / totalSteps) * 100) : 0;

        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('id, title')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (habitsError) throw habitsError;
        const habits = habitsData || [];

        const { data: habitLogsData, error: logsError } = await supabase
          .from('habit_logs')
          .select('habit_id, completed_date, value')
          .in('habit_id', habits.map(h => h.id))
          .order('completed_date', { ascending: false });

        if (logsError) throw logsError;
        const habitLogs = habitLogsData || [];

        let topHabitResult = { name: 'No habits yet', streak: 0 };
        const habitsListWithProgress: HabitWithProgress[] = habits.map(habit => {
          const logs = habitLogs.filter(log => log.habit_id === habit.id);
          const completedLogs = logs
            .filter(log => log.value > 0)
            .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());

          let currentStreak = 0;
          let lastCompletedDate: string | undefined = undefined;

          if (completedLogs.length > 0) {
             lastCompletedDate = completedLogs[0].completed_date;
             const today = startOfDay(now);
             let currentDate = startOfDay(new Date(completedLogs[0].completed_date));

             const diffDays = differenceInDays(today, currentDate);

             if (diffDays <= 1) {
               currentStreak = 1;
               for (let i = 1; i < completedLogs.length; i++) {
                 const prevDate = startOfDay(new Date(completedLogs[i].completed_date));
                 if (differenceInDays(currentDate, prevDate) === 1) {
                   currentStreak++;
                   currentDate = prevDate;
                 } else {
                   break;
                 }
               }
             }
          }

          if (currentStreak > topHabitResult.streak) {
             topHabitResult = { name: habit.title, streak: currentStreak };
          }

          return {
            id: habit.id,
            name: habit.title,
            progress: currentStreak,
            last_completed: lastCompletedDate
          };
        });

        const startOfMonthDate = startOfMonth(now);
        const endOfToday = endOfDay(now);

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, type, category')
          .eq('user_id', userId)
          .gte('date', startOfMonthDate.toISOString())
          .lte('date', endOfToday.toISOString());

        if (transactionsError) throw transactionsError;
        const transactions = transactionsData || [];

        const { data: subscriptionsTrackerData, error: subscriptionsTrackerError } = await supabase
          .from('subscriptions_tracker')
          .select('amount, billing_cycle, status')
          .eq('user_id', userId)
          .eq('status', 'active');

        if (subscriptionsTrackerError) throw subscriptionsTrackerError;
        const subscriptionsFromTracker = subscriptionsTrackerData || [];

        let monthlySubscriptionCost = 0;
        subscriptionsFromTracker.forEach(sub => {
          switch (sub.billing_cycle?.toLowerCase()) {
            case 'monthly':
              monthlySubscriptionCost += sub.amount;
              break;
            case 'yearly':
              monthlySubscriptionCost += sub.amount / 12;
              break;
            case 'quarterly':
              monthlySubscriptionCost += sub.amount / 3;
              break;
          }
        });

        let income = 0;
        let fixedExpenses = monthlySubscriptionCost;
        let variableExpenses = 0;
        transactions.forEach(t => {
          if (t.type === 'income') {
            income += t.amount;
          } else if (t.type === 'expense') {
            const categoryLower = t.category?.toLowerCase() || '';
            const fixedCategories = ['rent', 'loan', 'subscription', 'suscripciones', 'vivienda', 'seguro'];
            
            if (fixedCategories.includes(categoryLower)) {
               fixedExpenses += t.amount;
            } else {
               variableExpenses += t.amount;
            }
          }
        });
        const totalExpenses = fixedExpenses + variableExpenses;
        const currentBalance = income - totalExpenses;
        const savings = income - totalExpenses;

        const placeholderMonthlyChange = 0;

        const financialSummary: FinancialSummary = {
          income,
          fixedExpenses,
          variableExpenses,
          savings: savings > 0 ? savings : 0,
          balance: currentBalance,
          monthlyChange: placeholderMonthlyChange,
        };

        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, due_date, priority')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(3);

        if (tasksError) throw tasksError;
        const upcomingTasks: Task[] = tasksData || [];

        const startOfToday = startOfDay(now);

        const { data: eventsData, error: eventsError } = await supabase
           .from('calendar_events')
           .select('id, title, start_time, end_time, description')
           .eq('user_id', userId)
           .gte('start_time', startOfToday.toISOString())
           .lte('start_time', endOfToday.toISOString())
           .order('start_time', { ascending: true });

         if (eventsError) throw eventsError;
         const todayEvents: CalendarEvent[] = eventsData || [];

         const { data: nextEventData, error: nextEventError } = await supabase
           .from('calendar_events')
           .select('title, start_time')
           .eq('user_id', userId)
           .gte('start_time', now.toISOString())
           .order('start_time', { ascending: true })
           .limit(1)
           .single();

        let nextEventResult = null;
        if (nextEventData && !nextEventError) {
          nextEventResult = {
            title: nextEventData.title,
            time: format(new Date(nextEventData.start_time), 'HH:mm'),
          };
        } else if (nextEventError && nextEventError.code !== 'PGRST116') {
            throw nextEventError;
        }

        setData({
          goalsProgress: overallGoalsProgress,
          topHabit: topHabitResult,
          finances: financialSummary,
          nextEvent: nextEventResult,
          upcomingTasks: upcomingTasks,
          goalsList: goalsWithProgress,
          todayEvents: todayEvents,
          habitsList: habitsListWithProgress,
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
    };
  }, []);

  return { data, loading, error };
} 
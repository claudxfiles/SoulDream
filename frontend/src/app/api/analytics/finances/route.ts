import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el mes actual y el mes anterior
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    // Obtener todas las transacciones del usuario
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
      .lte('date', format(currentMonthEnd, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 });
    }

    // Obtener las suscripciones activas del usuario
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }

    // Calcular gastos por categoría (incluyendo suscripciones)
    const expensesByCategory: { [key: string]: number } = {};
    
    // Agregar gastos regulares
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + transaction.amount;
      });

    // Agregar gastos de suscripciones
    subscriptions.forEach(subscription => {
      // Convertir el monto mensual/anual a mensual
      const monthlyAmount = subscription.billing_cycle === 'annual' 
        ? subscription.amount / 12 
        : subscription.amount;
      
      expensesByCategory[subscription.category] = (expensesByCategory[subscription.category] || 0) + monthlyAmount;
    });

    // Calcular el total de gastos por categoría y sus porcentajes
    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    const expensesByCategoryWithPercentage = Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / totalExpenses) * 100)
    }));

    // Preparar datos para el gráfico de líneas de ingresos vs gastos
    const dateRange = transactions.reduce((acc: { [key: string]: { income: number; expense: number } }, transaction) => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // Agregar gastos de suscripciones al gráfico de líneas
    const monthlySubscriptionTotal = subscriptions.reduce((total, subscription) => {
      return total + (subscription.billing_cycle === 'annual' 
        ? subscription.amount / 12 
        : subscription.amount);
    }, 0);

    // Distribuir el gasto de suscripciones uniformemente a lo largo del mes
    Object.keys(dateRange).forEach(date => {
      const daysInMonth = new Date(date).getDate();
      dateRange[date].expense += monthlySubscriptionTotal / daysInMonth;
    });

    const expenseTrend = Object.entries(dateRange).map(([date, values]) => ({
      date,
      income: values.income,
      expense: Math.round(values.expense * 100) / 100 // Redondear a 2 decimales
    }));

    // Preparar datos de suscripciones
    const subscriptionsByCategory = subscriptions.reduce((acc: { [key: string]: number }, subscription) => {
      const monthlyAmount = subscription.billing_cycle === 'annual' 
        ? subscription.amount / 12 
        : subscription.amount;
      acc[subscription.category] = (acc[subscription.category] || 0) + monthlyAmount;
      return acc;
    }, {});

    const subscriptionAnalytics = {
      total_monthly: monthlySubscriptionTotal,
      by_category: Object.entries(subscriptionsByCategory).map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / monthlySubscriptionTotal) * 100)
      })),
      count: subscriptions.length
    };

    return NextResponse.json({
      expenses_by_category: expensesByCategoryWithPercentage,
      expense_trend: expenseTrend,
      subscriptions: subscriptionAnalytics
    });

  } catch (error) {
    console.error('Error in finance analytics:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 
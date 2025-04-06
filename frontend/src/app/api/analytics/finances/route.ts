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

    // Calcular gastos por categoría
    const expensesByCategory: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + transaction.amount;
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

    const expenseTrend = Object.entries(dateRange).map(([date, values]) => ({
      date,
      income: values.income,
      expense: values.expense
    }));

    return NextResponse.json({
      expenses_by_category: expensesByCategoryWithPercentage,
      expense_trend: expenseTrend
    });

  } catch (error) {
    console.error('Error in finance analytics:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 
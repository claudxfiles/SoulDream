import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Transaction {
  id: string;
  user_id: string;
  type: 'expense' | 'income' | 'subscription';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_frequency?: string;
}

interface SubscriptionTracker {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  provider: string;
  status: 'active' | 'cancelled' | 'paused';
  next_billing_date: string;
  category: string;
}

interface CategoryTotal {
  amount: number;
  count: number;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface Subscription {
  name: string;
  amount: number;
  billing_cycle: string;
  provider?: string;
  status?: string;
  next_billing_date?: string;
}

interface FinanceData {
  expenses_by_category: ExpenseCategory[];
  expense_trend: { date: string; amount: number }[];
  subscriptions: Subscription[];
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Usuario no autenticado');

    // Obtener transacciones del usuario
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });

    if (transactionsError) throw transactionsError;

    // Calcular gastos por categoría
    const expensesByCategory = (transactions as Transaction[]).reduce<Record<string, CategoryTotal>>((acc, transaction) => {
      const category = transaction.category || 'Otros';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {});

    // Calcular el total de gastos
    const totalExpenses = Object.values(expensesByCategory).reduce(
      (sum, { amount }) => sum + amount,
      0
    );

    // Formatear gastos por categoría
    const expenses_by_category = Object.entries(expensesByCategory).map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: Math.round((data.amount / totalExpenses) * 100)
    }));

    // 1. Obtener suscripciones de la tabla subscriptions_tracker
    const { data: trackedSubscriptions, error: trackedError } = await supabase
      .from('subscriptions_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('amount', { ascending: false });

    // 2. Obtener transacciones marcadas como suscripciones
    const { data: subscriptionTransactions, error: subTransError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', 'Suscripciones')
      .order('amount', { ascending: false });

    if (trackedError && subTransError) {
      throw new Error('Error al obtener suscripciones');
    }

    // Combinar y deduplicar suscripciones
    const allSubscriptions = [
      // Suscripciones de subscriptions_tracker
      ...(trackedSubscriptions || []).map((s: SubscriptionTracker) => ({
        name: s.name,
        amount: s.amount,
        billing_cycle: s.billing_cycle,
        provider: s.provider,
        status: s.status,
        next_billing_date: s.next_billing_date
      })),
      // Suscripciones de transacciones
      ...(subscriptionTransactions || []).map((t: Transaction) => ({
        name: t.description || 'Suscripciones',
        amount: t.amount,
        billing_cycle: t.payment_frequency || 'Mensual'
      }))
    ];

    // Deduplicar por nombre y amount
    const uniqueSubscriptions = allSubscriptions.reduce((acc: Subscription[], current) => {
      const exists = acc.some(s => 
        s.name === current.name && 
        s.amount === current.amount
      );
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Formatear datos para la respuesta
    const financeData: FinanceData = {
      expenses_by_category,
      expense_trend: (transactions as Transaction[]).map(t => ({
        date: t.date.split('T')[0],
        amount: t.amount
      })),
      subscriptions: uniqueSubscriptions
    };

    return NextResponse.json(financeData);
  } catch (error) {
    console.error('Error al obtener datos financieros:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos financieros' },
      { status: 500 }
    );
  }
} 
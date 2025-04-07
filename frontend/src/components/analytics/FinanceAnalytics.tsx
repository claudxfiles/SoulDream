'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFinanceAnalytics } from "@/hooks/useFinanceAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface Subscription {
  name: string;
  amount: number;
  billing_cycle: string;
}

interface FinanceData {
  expenses_by_category: ExpenseCategory[];
  expense_trend: Array<{
    date: string;
    amount: number;
  }>;
  subscriptions: Subscription[];
}

interface ExpenseTrend {
  date: string;
  income: number;
  expense: number;
}

interface SubscriptionAnalytics {
  total_monthly: number;
  by_category: ExpenseCategory[];
  count: number;
}

// Colores primarios del sistema de diseño
const PRIMARY_COLOR = '#4f46e5'; // Indigo
const SECONDARY_COLOR = '#10b981'; // Emerald
const ACCENT_COLOR = '#f59e0b'; // Amber

const CATEGORY_COLORS = {
  'Vivienda': PRIMARY_COLOR,
  'Servicios': '#6366f1', // Indigo más claro
  'Ropa': '#818cf8', // Indigo aún más claro
  'Suscripciones': SECONDARY_COLOR,
  'Software': '#34d399', // Emerald más claro
  'Alimentación': '#6ee7b7', // Emerald aún más claro
  'Transporte': ACCENT_COLOR,
  'Ocio': '#fcd34d', // Amber más claro
  'Otros': '#94a3b8', // Slate
};

export function FinanceAnalytics() {
  const { data, isLoading, error } = useFinanceAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        Error al cargar los datos financieros
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { expenses_by_category, expense_trend, subscriptions } = data;

  return (
    <div className="grid gap-6">
      {/* Gráfico de Gastos por Categoría */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Gastos por Categoría</CardTitle>
            <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
            Distribución de gastos del mes actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses_by_category}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {expenses_by_category.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {expenses_by_category.map((category, index) => (
              <div key={category.category} className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: CATEGORY_COLORS[category.category as keyof typeof CATEGORY_COLORS] }} 
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{category.category}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">${category.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tendencia de Gastos */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Tendencia de Gastos</CardTitle>
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expense_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'dd/MM')}
                    className="text-sm"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    className="text-sm"
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    labelFormatter={(date) => format(parseISO(date), 'dd MMMM yyyy')}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={PRIMARY_COLOR}
                    strokeWidth={3}
                    dot={{ fill: PRIMARY_COLOR, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: PRIMARY_COLOR, strokeWidth: 0 }}
                    className="transition-all duration-300"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Suscripciones */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Suscripciones</CardTitle>
              <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div 
                  key={subscription.name}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-400 text-lg font-semibold">
                        {subscription.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{subscription.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{subscription.billing_cycle}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">${subscription.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
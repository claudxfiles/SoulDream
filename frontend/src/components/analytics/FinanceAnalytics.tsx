'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceAnalytics } from "@/hooks/useFinanceAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Ingresos vs Gastos */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actualizado hace menos de un minuto
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={expense_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                  labelFormatter={(label) => new Date(label as string).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke={SECONDARY_COLOR}
                  name="Ingresos"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke={PRIMARY_COLOR}
                  name="Gastos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Distribución de Gastos por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Gastos por Categoría</CardTitle>
          <p className="text-sm text-muted-foreground">
            Actualizado hace menos de un minuto
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenses_by_category}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percentage }: ExpenseCategory) => `${category}: ${percentage}%`}
                >
                  {expenses_by_category.map((entry: ExpenseCategory, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Otros}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Suscripciones por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Suscripciones Mensuales</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: ${subscriptions.total_monthly.toLocaleString('es-CL')} · {subscriptions.count} suscripciones activas
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptions.by_category}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percentage }: ExpenseCategory) => `${category}: ${percentage}%`}
                >
                  {subscriptions.by_category.map((entry: ExpenseCategory, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Otros}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
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

const CATEGORY_COLORS = {
  'Alimentación': '#10b981', // verde
  'Transporte': '#ef4444', // rojo
  'Hogar': '#3b82f6', // azul
  'Salud': '#ec4899', // rosa
  'Ocio': '#f59e0b', // naranja
  'Otros': '#6b7280', // gris
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

  const { expenses_by_category, expense_trend } = data;

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
                  stroke="#10b981" 
                  name="Ingresos"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#ef4444" 
                  name="Gastos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Distribución de Gastos por Categoría */}
      <Card className="col-span-2">
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
    </div>
  );
} 
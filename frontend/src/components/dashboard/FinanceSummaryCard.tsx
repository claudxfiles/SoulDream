'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, AlertCircle } from 'lucide-react';

interface FinancialSummary {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  savings: number;
  balance: number;
  monthlyChange: number; // Placeholder, assuming positive value indicates improvement
}

interface FinanceSummaryCardProps {
  summary: FinancialSummary;
}

const formatCurrency = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
};

export function FinanceSummaryCard({ summary }: FinanceSummaryCardProps) {
  const totalExpenses = summary.fixedExpenses + summary.variableExpenses;
  const hasSaved = summary.savings > 0;
  // Placeholder: Calculate a simple percentage saved from income
  const savingsPercentage = summary.income > 0 ? Math.round((summary.savings / summary.income) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Finanzas</CardTitle>
        <Link href="/dashboard/finance" className="text-xs text-muted-foreground hover:text-primary">
          Ver detalles
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-4">
          <li className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ingresos</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.income)}</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gastos fijos</span>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(-summary.fixedExpenses)}</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Gastos variables</span>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(-summary.variableExpenses)}</span>
          </li>
          <li className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ahorros</span>
            <span className={`text-sm font-medium ${hasSaved ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
              {formatCurrency(summary.savings)}
            </span>
          </li>
          <li className="border-t my-2"></li>
          <li className="flex justify-between items-center">
            <span className="text-sm font-bold">Balance (Mes)</span>
            <span className={`text-sm font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>{formatCurrency(summary.balance)}</span>
          </li>
        </ul>
        {/* Financial Insight/Tip Section (Example) */}
        <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-start space-x-3">
          <PiggyBank className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">Finanzas</p>
            {hasSaved ? (
              <p className="text-xs text-purple-700 dark:text-purple-300">
                ¡Bien hecho! Has ahorrado un {savingsPercentage}% más que el mes pasado (Ejemplo).
              </p>
            ) : (
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Intenta reducir gastos variables para empezar a ahorrar.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
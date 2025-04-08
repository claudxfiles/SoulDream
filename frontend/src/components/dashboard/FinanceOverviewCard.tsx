'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Scale, Sparkles } from 'lucide-react'; // Added Sparkles
import { cn } from '@/lib/utils';

// Define the expected structure for the finances prop
interface FinanceData {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  savings: number;
  balance: number; // Assuming balance represents the net result for the month
}

interface FinanceOverviewCardProps {
  finances: FinanceData;
  className?: string;
}

const formatCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '-';
  // Use 'es-CL' locale for Chilean Peso format if desired, or keep 'en-US' for generic dollar
  // Add currency symbol if needed, e.g., 'CLP' or 'USD'
  return `${sign}$${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function FinanceOverviewCard({ finances, className }: FinanceOverviewCardProps) {
  // Handle potential null/undefined finances object gracefully
  const safeFinances = finances || {
    income: 0,
    fixedExpenses: 0,
    variableExpenses: 0,
    savings: 0,
    balance: 0,
  };

  const { income, fixedExpenses, variableExpenses, savings, balance } = safeFinances;
  const totalExpenses = fixedExpenses + variableExpenses;

  return (
    <Card className={cn("group transition-transform duration-200 ease-in-out hover:scale-[1.02]", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Scale className="h-5 w-5 mr-2 text-blue-500" />
          Resumen Financiero (Mes)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
            Ingresos
          </span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(income)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-muted-foreground">
            <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
            Gastos Fijos
          </span>
          <span className="font-medium text-red-600 dark:text-red-400">
            {formatCurrency(-fixedExpenses)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-muted-foreground">
            <TrendingDown className="h-4 w-4 mr-2 text-orange-500" />
            Gastos Variables
          </span>
          <span className="font-medium text-orange-600 dark:text-orange-400">
             {formatCurrency(-variableExpenses)}
          </span>
        </div>
         <div className="flex justify-between items-center">
          <span className="flex items-center text-muted-foreground">
            <PiggyBank className="h-4 w-4 mr-2 text-blue-500" />
            Ahorros
          </span>
          <span className={cn(
              "font-medium",
              savings >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
            )}>
            {formatCurrency(savings)}
          </span>
        </div>
        <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-900 dark:text-white">
            Balance (Mes)
          </span>
          <span className={cn(
              "font-bold text-lg",
              balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
             {formatCurrency(balance)}
          </span>
        </div>
         {/* Optional Insight Box - Added Sparkles icon import */}
         {/* <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
           <p className="text-xs text-purple-700 dark:text-purple-300">
             <Sparkles className="h-3 w-3 inline mr-1" />
             ¡Bien hecho! Has ahorrado un X% más que el mes pasado (Ejemplo).
           </p>
         </div> */}
      </CardContent>
    </Card>
  );
} 
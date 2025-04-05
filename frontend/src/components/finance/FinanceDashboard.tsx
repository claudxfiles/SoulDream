'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinance } from '@/hooks/useFinance';
import { Transaction, FinancialAsset } from '@/lib/finance';

// Componente para una transacción individual
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  const isIncome = transaction.type === 'income';
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'comida':
        return '🍔';
      case 'transporte':
        return '🚗';
      case 'entretenimiento':
        return '🎬';
      case 'salud':
        return '🏥';
      case 'hogar':
        return '🏠';
      case 'educación':
        return '📚';
      case 'salario':
        return '💼';
      case 'inversiones':
        return '📈';
      default:
        return '💰';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
          <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {transaction.category} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>
      </div>
      <div className={`font-medium ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
      </div>
    </div>
  );
};

// Componente para el resumen financiero
const FinanceSummary = () => {
  const { summary, loading } = useFinance();

  if (loading.summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance actual</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${summary?.balance.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-full">
            <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos (este mes)</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${summary?.income.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos (este mes)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${summary?.expenses.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Componente para las metas financieras
const FinancialGoals = () => {
  const { financialAssets: goals, loading } = useFinance();

  if (loading.assets) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metas financieras</h2>
        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-4">
        {goals?.map((goal: FinancialAsset) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ${goal.current_amount} / ${goal.target_amount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Meta: {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Componente para las transacciones recientes
const RecentTransactions = () => {
  const { transactions, loading } = useFinance();

  if (loading.transactions) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-4">
              <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transacciones recientes</h2>
        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {transactions?.slice(0, 5).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </Card>
  );
};

// Componente principal del dashboard financiero
export function FinanceDashboard() {
  const { loading } = useFinance();

  if (Object.values(loading).every(value => value)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FinanceSummary />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <FinancialGoals />
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar, 
  PieChart, 
  Plus, 
  Filter 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para las transacciones
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
}

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
  // Datos de ejemplo
  const summary = {
    balance: 2450.75,
    income: 3200.00,
    expenses: 749.25,
    savingsGoal: 10000,
    currentSavings: 6500
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance actual</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${summary.balance.toFixed(2)}</p>
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
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">${summary.income.toFixed(2)}</p>
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
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">${summary.expenses.toFixed(2)}</p>
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
  // Datos de ejemplo
  const goals = [
    {
      id: '1',
      title: 'Fondo de emergencia',
      currentAmount: 2500,
      targetAmount: 5000,
      deadline: '2023-12-31'
    },
    {
      id: '2',
      title: 'Vacaciones',
      currentAmount: 1200,
      targetAmount: 3000,
      deadline: '2023-08-15'
    },
    {
      id: '3',
      title: 'Nuevo laptop',
      currentAmount: 800,
      targetAmount: 1500,
      deadline: '2023-10-01'
    }
  ];

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metas financieras</h2>
        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ${goal.currentAmount} / ${goal.targetAmount}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Meta: {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Componente principal del dashboard financiero
export function FinanceDashboard() {
  // Datos de ejemplo
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'income',
      amount: 2500.00,
      category: 'Salario',
      description: 'Salario mensual',
      date: '2023-05-01'
    },
    {
      id: '2',
      type: 'expense',
      amount: 120.50,
      category: 'Comida',
      description: 'Supermercado',
      date: '2023-05-03',
      paymentMethod: 'Tarjeta de crédito'
    },
    {
      id: '3',
      type: 'expense',
      amount: 45.00,
      category: 'Transporte',
      description: 'Gasolina',
      date: '2023-05-05',
      paymentMethod: 'Efectivo'
    },
    {
      id: '4',
      type: 'expense',
      amount: 200.00,
      category: 'Entretenimiento',
      description: 'Cine y cena',
      date: '2023-05-07',
      paymentMethod: 'Tarjeta de débito'
    },
    {
      id: '5',
      type: 'income',
      amount: 700.00,
      category: 'Freelance',
      description: 'Proyecto de diseño',
      date: '2023-05-10'
    },
    {
      id: '6',
      type: 'expense',
      amount: 85.75,
      category: 'Servicios',
      description: 'Internet',
      date: '2023-05-12',
      paymentMethod: 'Domiciliación'
    },
    {
      id: '7',
      type: 'expense',
      amount: 298.00,
      category: 'Hogar',
      description: 'Muebles',
      date: '2023-05-15',
      paymentMethod: 'Tarjeta de crédito'
    }
  ]);

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
          <Plus size={16} className="mr-2" />
          Nueva transacción
        </button>
      </div>
      
      {/* Resumen financiero */}
      <FinanceSummary />
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transacciones recientes */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transacciones recientes</h2>
            <div className="flex space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <Filter size={16} />
              </button>
              <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
                Ver todas
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.slice(0, 5).map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </Card>
        
        {/* Metas financieras */}
        <FinancialGoals />
      </div>
    </div>
  );
} 
'use client';

import React from 'react';
import { 
  DollarSign, 
  Target,
  TrendingUp,
  Clock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData();

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error al cargar los datos: {error.message}
      </div>
    );
  }

  const monthlyChange = data?.finances?.monthlyChange || 0;
  const isPositiveChange = monthlyChange >= 0;

  return (
    <div className="p-4">
      {/* Hero Dashboard Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">SoulDream Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Bienvenido de nuevo. Aquí está el resumen de tu progreso.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-2 mt-4 md:mt-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-4 flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {/* Progress overview cards */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PROGRESO DE METAS</p>
                    <h3 className="text-xl font-bold mt-1">{data?.goalsProgress}%</h3>
                  </div>
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${data?.goalsProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">HÁBITO DESTACADO</p>
                    <h3 className="text-lg font-bold mt-1">{data?.topHabit.name}</h3>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {data?.topHabit.streak} días consecutivos
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">FINANZAS</p>
                    <h3 className="text-xl font-bold mt-1">${data?.finances.balance.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${isPositiveChange ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                  <p className={`text-sm ${isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositiveChange ? '+' : ''}{Math.round(monthlyChange)}% este mes
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PRÓXIMO EVENTO</p>
                    <h3 className="text-lg font-bold mt-1">{data?.nextEvent.title}</h3>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Hoy - {data?.nextEvent.time}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 
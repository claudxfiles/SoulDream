'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Dumbbell, 
  TrendingUp, 
  Clock, 
  Target,
  PieChart,
  Receipt,
  Home,
  Calculator,
  CheckCircle2
} from 'lucide-react';
import { GoalsSummary } from '@/components/goals/GoalsSummary';
import { Goal } from '@/components/goals/GoalsDashboard';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  // Datos de ejemplo para el dashboard
  const stats = [
    { 
      title: 'Tareas pendientes', 
      value: '5', 
      icon: <CheckSquare className="h-8 w-8 text-indigo-600" />,
      change: '+2 desde ayer',
      trend: 'up'
    },
    { 
      title: 'Eventos hoy', 
      value: '3', 
      icon: <Calendar className="h-8 w-8 text-emerald-600" />,
      change: '1 reunión importante',
      trend: 'neutral'
    },
    { 
      title: 'Balance', 
      value: '$2,450', 
      icon: <DollarSign className="h-8 w-8 text-amber-600" />,
      change: '+$150 este mes',
      trend: 'up'
    },
    { 
      title: 'Streak de hábitos', 
      value: '12 días', 
      icon: <TrendingUp className="h-8 w-8 text-indigo-600" />,
      change: 'Mejor racha: 15 días',
      trend: 'up'
    },
  ];

  const upcomingTasks = [
    { id: 1, title: 'Completar informe mensual', dueDate: '2023-05-15', priority: 'high' },
    { id: 2, title: 'Reunión con cliente', dueDate: '2023-05-16', priority: 'medium' },
    { id: 3, title: 'Revisar propuesta', dueDate: '2023-05-17', priority: 'low' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Reunión de equipo', time: '10:00 AM', duration: '1h', location: 'Sala de conferencias', date: 'Hoy', category: 'work' },
    { id: 2, title: 'Almuerzo con cliente', time: '13:30 PM', duration: '1.5h', location: 'Restaurante Central', date: 'Hoy', category: 'work' },
    { id: 3, title: 'Clase de yoga', time: '18:00 PM', duration: '1h', location: 'Gimnasio', date: 'Mañana', category: 'personal' },
  ];

  const goals = [
    { id: 1, title: 'Ahorrar para vacaciones', progress: 65, category: 'finance' },
    { id: 2, title: 'Correr 5km', progress: 40, category: 'fitness' },
    { id: 3, title: 'Aprender React', progress: 80, category: 'education' },
  ];

  // Datos de ejemplo para las metas
  const exampleGoals: Goal[] = [
    {
      id: '1',
      title: 'Comprar moto',
      description: 'Ahorrar para comprar una moto Honda CB500F',
      area: 'finanzas',
      targetDate: '2024-12-31',
      progressPercentage: 35,
      status: 'active',
      priority: 'high',
      visualizationImageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      type: 'adquisicion',
      steps: [
        {
          id: '1-1',
          title: 'Investigar modelos y precios',
          description: 'Comparar diferentes modelos y sus precios en el mercado',
          status: 'completed',
          aiGenerated: true
        },
        {
          id: '1-2',
          title: 'Crear fondo de ahorro específico',
          description: 'Abrir una cuenta de ahorro dedicada para la moto',
          status: 'completed',
          aiGenerated: true
        },
        {
          id: '1-3',
          title: 'Ahorrar $500 mensuales',
          description: 'Transferir $500 al fondo de ahorro cada mes',
          status: 'in_progress',
          dueDate: '2024-12-01',
          aiGenerated: true
        }
      ]
    },
    {
      id: '2',
      title: 'Aprender desarrollo web fullstack',
      description: 'Dominar tecnologías frontend y backend para desarrollo web',
      area: 'educacion',
      targetDate: '2024-08-31',
      progressPercentage: 60,
      status: 'active',
      priority: 'high',
      type: 'aprendizaje',
      steps: []
    }
  ];

  const habits = [
    { id: 1, title: 'Meditación diaria', progress: 75 },
    { id: 2, title: 'Ejercicio', progress: 60 },
    { id: 3, title: 'Lectura', progress: 40 },
  ];

  const financialSummary = [
    { category: 'Ingresos', amount: 3500 },
    { category: 'Gastos fijos', amount: -1200 },
    { category: 'Gastos variables', amount: -850 },
    { category: 'Ahorros', amount: 1000 },
  ];

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
          {/* Progress overview cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PROGRESO DE METAS</p>
                <h3 className="text-xl font-bold mt-1">68%</h3>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
              <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">HÁBITO DESTACADO</p>
                <h3 className="text-lg font-bold mt-1">Meditación</h3>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300">7 días consecutivos</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">FINANZAS</p>
                <h3 className="text-xl font-bold mt-1">$3,650</h3>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-sm text-green-600 dark:text-green-400">+15% este mes</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PRÓXIMO EVENTO</p>
                <h3 className="text-lg font-bold mt-1">Reunión equipo</h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">Hoy - 10:00 AM</p>
            </div>
          </div>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className={`text-xs mt-1 ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                  stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tareas próximas */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Tareas próximas
              </h2>
              <a href="/dashboard/tasks" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver todas
              </a>
            </div>
            
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Vence: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <CheckSquare className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Calendario */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Calendario
              </h2>
              <a href="/dashboard/calendar" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver completo
              </a>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    event.category === 'work' ? 'bg-blue-500' : 
                    event.category === 'personal' ? 'bg-purple-500' : 
                    'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.time} - {event.location}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {event.date}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Metas */}
          <GoalsSummary goals={exampleGoals} />
          
          {/* Finanzas */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Finanzas
              </h2>
              <a href="/dashboard/finance" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver detalles
              </a>
            </div>
            
            <div className="space-y-3">
              {financialSummary.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.category}</p>
                  <p className={`text-sm font-medium ${
                    item.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </p>
                </div>
              ))}
              
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Balance</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {financialSummary.reduce((acc, item) => acc + item.amount, 0).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'USD'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Mensaje de ahorro */}
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                  <span className="text-white text-xs">🔹</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Finanzas</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Has ahorrado un 15% más que el mes pasado
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Hábitos */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Hábitos
              </h2>
              <a href="/dashboard/habits" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Ver todos
              </a>
            </div>
            
            <div className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{habit.title}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${habit.progress}%` }}></div>
                    </div>
                  </div>
                  <p className="ml-4 text-xs font-medium text-gray-500 dark:text-gray-400">{habit.progress}%</p>
                </div>
              ))}
            </div>
            
            {/* Notificación de hábito completado */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Hábito completado</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ¡Has mantenido tu racha por 7 días consecutivos!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="p-4 bg-card rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Gestión Financiera</h3>
        <div className="flex flex-col space-y-2">
          <Link href="/dashboard/finance" className="flex items-center text-muted-foreground hover:text-primary">
            <PieChart className="h-4 w-4 mr-2" />
            <span>Dashboard Financiero</span>
          </Link>
          <Link href="/dashboard/finance?tab=transactions" className="flex items-center text-muted-foreground hover:text-primary">
            <Receipt className="h-4 w-4 mr-2" />
            <span>Transacciones</span>
          </Link>
          <Link href="/dashboard/finance?tab=assets" className="flex items-center text-muted-foreground hover:text-primary">
            <Home className="h-4 w-4 mr-2" />
            <span>Planificador de Activos</span>
          </Link>
          <Link href="/dashboard/finance?tab=calculator" className="flex items-center text-muted-foreground hover:text-primary">
            <Calculator className="h-4 w-4 mr-2" />
            <span>Calculadora de Ahorro</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 
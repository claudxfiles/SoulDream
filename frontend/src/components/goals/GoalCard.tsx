'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Goal, GoalStep } from './GoalsDashboard';
import { GoalProgress } from './GoalProgress';

interface GoalCardProps {
  goal: Goal;
  areaName: string;
  areaIcon: React.ReactNode;
}

export function GoalCard({ goal, areaName, areaIcon }: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En progreso';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Normal';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'adquisicion':
        return 'Adquisición';
      case 'aprendizaje':
        return 'Aprendizaje';
      case 'habito':
        return 'Hábito';
      case 'otro':
        return 'Otro';
      default:
        return 'Otro';
    }
  };

  // Calcular el progreso basado en los pasos completados
  const completedSteps = goal.steps.filter(step => step.status === 'completed').length;
  const totalSteps = goal.steps.length;
  const stepsProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="mt-1">{areaIcon}</div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{goal.title}</h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-2">{areaName}</span>
                <span className="mr-2">•</span>
                <span>{getTypeText(goal.type)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(goal.priority)}`}>
              {getPriorityText(goal.priority)}
            </span>
            <button 
              onClick={toggleExpanded}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {goal.description}
          </p>
        </div>

        <div className="mt-4">
          <GoalProgress percentage={goal.progressPercentage} />
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Progreso: {goal.progressPercentage}%</span>
            <span className="flex items-center">
              <Calendar size={12} className="mr-1" />
              Meta para: {format(new Date(goal.targetDate), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="mt-6 border-t pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Pasos a seguir</h4>
            <ul className="space-y-3">
              {goal.steps.map((step) => (
                <li key={step.id} className="flex items-start">
                  <div className="mt-0.5 mr-3">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getStatusText(step.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {step.description}
                    </p>
                    {step.dueDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                        <Calendar size={10} className="mr-1" />
                        Para: {format(new Date(step.dueDate), 'dd MMM yyyy', { locale: es })}
                      </p>
                    )}
                    {step.aiGenerated && (
                      <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        Generado por IA
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
} 
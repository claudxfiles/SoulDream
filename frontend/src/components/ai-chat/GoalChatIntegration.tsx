'use client';

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal } from '@/types/goal';
import { Badge } from '../ui/badge';
import { CalendarIcon, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { MetaAIPanel } from './MetaAIPanel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface GoalChatIntegrationProps {
  message: string;
  metadata: any;
  onCreateGoal: (goalData: Partial<Goal>) => void;
  onCreateTask?: (taskTitle: string, goalId: string) => void;
}

export function GoalChatIntegration({ message, metadata, onCreateGoal, onCreateTask }: GoalChatIntegrationProps) {
  const [showGoalCard, setShowGoalCard] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(false);
  const [goalData, setGoalData] = useState<Partial<Goal> | null>(null);

  useEffect(() => {
    // Solo mostrar la tarjeta si hay metadatos con área y tipo
    if (metadata && metadata.area && metadata.goalType && metadata.confidence > 0.6) {
      const newGoalData: Partial<Goal> = {
        title: metadata.title || `Meta de ${metadata.area}`,
        description: message,
        category: metadata.area,
        type: metadata.goalType,
        status: 'active',
        priority: 'medium',
        steps: metadata.steps || [],
        timeframe: metadata.timeframe || { 
          startDate: new Date(), 
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días por defecto
        }
      };
      
      setGoalData(newGoalData);
      setShowGoalCard(true);
    } else {
      setShowGoalCard(false);
    }
  }, [message, metadata]);

  const handleCreateGoal = () => {
    if (goalData) {
      onCreateGoal(goalData);
      // Mostrar el panel de Meta-AI después de crear la meta
      setShowMetaPanel(true);
      // Ocultar la tarjeta de detección
      setShowGoalCard(false);
    }
  };
  
  const handleCloseMetaPanel = () => {
    setShowMetaPanel(false);
  };
  
  const handleCreateTask = (taskTitle: string, goalId: string) => {
    if (onCreateTask) {
      onCreateTask(taskTitle, goalId);
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  };

  // Si se está mostrando el panel completo, no mostrar la tarjeta de detección
  if (showMetaPanel && goalData) {
    return (
      <MetaAIPanel 
        goal={goalData} 
        onClose={handleCloseMetaPanel} 
        onCreateTask={handleCreateTask}
      />
    );
  }

  if (!showGoalCard) return null;

  return (
    <Card className="mb-4 border-dashed border-2 border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Detectamos una posible meta
        </CardTitle>
        <CardDescription>
          ¿Quieres crear una meta basada en tu mensaje?
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium">{goalData?.title}</h4>
            <p className="text-sm text-muted-foreground">{goalData?.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {goalData?.category && (
              <Badge variant="outline" className="bg-primary/10">
                {goalData.category}
              </Badge>
            )}
            {goalData?.type && (
              <Badge variant="outline" className="bg-secondary/10">
                {goalData.type}
              </Badge>
            )}
            {goalData?.timeframe && (
              <Badge variant="outline" className="bg-accent/10 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {goalData.timeframe ? 
                  (typeof goalData.timeframe.startDate === 'object' 
                    ? formatDate(goalData.timeframe.startDate)
                    : formatDate(goalData.timeframe.startDate)) + ' - ' +
                  (typeof goalData.timeframe.endDate === 'object'
                    ? formatDate(goalData.timeframe.endDate)
                    : formatDate(goalData.timeframe.endDate))
                  : ''
                }
              </Badge>
            )}
          </div>
          
          {goalData?.steps && goalData.steps.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium mb-1">Pasos sugeridos:</h5>
              <ul className="text-sm space-y-1">
                {goalData.steps.slice(0, 3).map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
                {goalData.steps.length > 3 && (
                  <li className="text-xs text-muted-foreground pl-7">
                    +{goalData.steps.length - 3} pasos más...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={() => setShowGoalCard(false)}>
          Ignorar
        </Button>
        <Button size="sm" onClick={handleCreateGoal}>
          Crear Meta
        </Button>
      </CardFooter>
    </Card>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Target, ArrowRight, Calendar, CheckSquare, PlusCircle } from 'lucide-react';
import { Goal } from '@/types/goal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MetaAIPanelProps {
  goal: Partial<Goal>;
  onClose: () => void;
  onCreateTask: (taskTitle: string, goalId: string) => void;
}

export function MetaAIPanel({ goal, onClose, onCreateTask }: MetaAIPanelProps) {
  const [activeTab, setActiveTab] = useState('meta');
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Simular progreso incremental
  useEffect(() => {
    const timer = setTimeout(() => {
      if (progress < 100) {
        setProgress(prev => Math.min(prev + 5, 100));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [progress]);
  
  // Manejar la selección de pasos completados
  const toggleStepCompletion = (index: number) => {
    setCompletedSteps(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Crear una tarea a partir de un paso
  const handleCreateTask = (step: string) => {
    if (goal.id) {
      onCreateTask(step, goal.id);
    }
  };
  
  // Formatear fechas para mostrar
  const formatDate = (dateObj: Date | string) => {
    if (!dateObj) return '';
    if (typeof dateObj === 'string') {
      return format(new Date(dateObj), 'dd/MM/yyyy', { locale: es });
    }
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  };
  
  // Calcular el progreso basado en pasos completados
  const calculateProgress = () => {
    if (!goal.steps || goal.steps.length === 0) return 0;
    return Math.round((completedSteps.length / goal.steps.length) * 100);
  };
  
  return (
    <Card className="w-full border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {goal.title || 'Nueva Meta'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <CardDescription>
          {goal.description || 'Descripción de la meta'}
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="meta" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="meta" className="flex-1">
              <Target className="h-4 w-4 mr-2" />
              Meta
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="accion" className="flex-1">
              <CheckSquare className="h-4 w-4 mr-2" />
              Acción
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="meta" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {goal.category && (
                  <Badge variant="outline" className="bg-primary/10">
                    {goal.category}
                  </Badge>
                )}
                {goal.type && (
                  <Badge variant="outline" className="bg-secondary/10">
                    {goal.type}
                  </Badge>
                )}
                {goal.priority && (
                  <Badge variant="outline" className={
                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                    goal.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }>
                    {goal.priority === 'high' ? 'Alta' : 
                     goal.priority === 'medium' ? 'Media' : 'Baja'} prioridad
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Progreso</h4>
                  <span className="text-sm text-muted-foreground">{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Timeframe</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {goal.timeframe ? (
                      <>
                        {formatDate(goal.timeframe.startDate)} 
                        <ArrowRight className="h-3 w-3 mx-1 inline" /> 
                        {formatDate(goal.timeframe.endDate)}
                      </>
                    ) : 'Timeframe no definido'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Plan de acción</h4>
              
              {goal.steps && goal.steps.length > 0 ? (
                <ul className="space-y-3">
                  {goal.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div 
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 cursor-pointer ${
                          completedSteps.includes(index) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-primary/20 text-primary'
                        }`}
                        onClick={() => toggleStepCompletion(index)}
                      >
                        {completedSteps.includes(index) ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${completedSteps.includes(index) ? 'line-through text-muted-foreground' : ''}`}>
                          {step}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pasos definidos para esta meta.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="accion" className="mt-0">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Convertir en tareas accionables</h4>
              
              {goal.steps && goal.steps.length > 0 ? (
                <ul className="space-y-3">
                  {goal.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full flex-shrink-0 mt-0.5"
                        onClick={() => handleCreateTask(step)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <p className="text-sm">{step}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pasos para convertir en tareas.</p>
              )}
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Haz clic en el botón + para crear una tarea a partir de un paso del plan.
                </p>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between bg-primary/5 pt-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
        <Button size="sm" onClick={() => setActiveTab(activeTab === 'meta' ? 'plan' : activeTab === 'plan' ? 'accion' : 'meta')}>
          {activeTab === 'meta' ? 'Ver Plan' : activeTab === 'plan' ? 'Ver Acción' : 'Ver Meta'}
        </Button>
      </CardFooter>
    </Card>
  );
} 
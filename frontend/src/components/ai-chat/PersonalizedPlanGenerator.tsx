'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Brain, Target, Clock, FileBarChart, Settings, Dumbbell, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { aiService, PersonalizedPlanRequest } from '@/services/ai';

interface PersonalizedPlanProps {
  userData: any;
  onClose?: () => void;
  onPlanCreated?: (plan: any) => void;
}

export function PersonalizedPlanGenerator({ userData, onClose, onPlanCreated }: PersonalizedPlanProps) {
  const [selectedGoalType, setSelectedGoalType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('configuracion');
  const [preferences, setPreferences] = useState({
    preferred_time_blocks: [],
    difficulty_preference: 'balanced',
    priority_areas: [],
    learning_style: 'balanced'
  });
  
  // Opciones para los tipos de metas
  const goalTypes = [
    { value: 'fitness', label: 'Fitness y Ejercicio' },
    { value: 'finanzas', label: 'Finanzas Personales' },
    { value: 'aprendizaje', label: 'Aprendizaje y Desarrollo' },
    { value: 'habito', label: 'Creación de Hábito' },
    { value: 'productividad', label: 'Productividad' }
  ];
  
  // Opciones para bloques de tiempo
  const timeBlocks = [
    { value: 'morning', label: 'Mañana (6AM-12PM)' },
    { value: 'afternoon', label: 'Tarde (12PM-6PM)' },
    { value: 'evening', label: 'Noche (6PM-10PM)' },
    { value: 'night', label: 'Madrugada (10PM-6AM)' }
  ];
  
  // Opciones para áreas prioritarias
  const priorityAreas = [
    { value: 'salud', label: 'Salud y Bienestar' },
    { value: 'relaciones', label: 'Relaciones Personales' },
    { value: 'carrera', label: 'Carrera Profesional' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'conocimiento', label: 'Conocimiento' }
  ];
  
  // Manejar cambios en preferencias
  const handleTimeBlockToggle = (value: string) => {
    setPreferences(prev => {
      const current = [...prev.preferred_time_blocks];
      if (current.includes(value)) {
        return { ...prev, preferred_time_blocks: current.filter(item => item !== value) };
      } else {
        return { ...prev, preferred_time_blocks: [...current, value] };
      }
    });
  };
  
  const handlePriorityAreaToggle = (value: string) => {
    setPreferences(prev => {
      const current = [...prev.priority_areas];
      if (current.includes(value)) {
        return { ...prev, priority_areas: current.filter(item => item !== value) };
      } else {
        return { ...prev, priority_areas: [...current, value] };
      }
    });
  };
  
  const handleDifficultyChange = (value: string) => {
    setPreferences(prev => ({ ...prev, difficulty_preference: value }));
  };
  
  const handleLearningStyleChange = (value: string) => {
    setPreferences(prev => ({ ...prev, learning_style: value }));
  };
  
  // Generar plan personalizado
  const handleGeneratePlan = async () => {
    if (!selectedGoalType) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un tipo de meta",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const request: PersonalizedPlanRequest = {
        user_data: userData,
        goal_type: selectedGoalType,
        preferences: preferences
      };
      
      const response = await aiService.generatePersonalizedPlan(request);
      
      if (response && response.personalized_plan) {
        setGeneratedPlan(response.personalized_plan);
        setActiveTab('plan');
        
        if (onPlanCreated) {
          onPlanCreated(response.personalized_plan);
        }
        
        toast({
          title: "Plan Generado",
          description: "Tu plan personalizado ha sido creado exitosamente",
          variant: "default"
        });
      } else {
        throw new Error("Formato de respuesta inválido");
      }
    } catch (error) {
      console.error("Error generando plan personalizado:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el plan personalizado. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de Planes Personalizados con IA
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        <CardDescription>
          Crea un plan personalizado adaptado a tus patrones de comportamiento y preferencias
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="configuracion" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="configuracion" className="flex-1" disabled={isGenerating}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-1" disabled={!generatedPlan || isGenerating}>
              <Target className="h-4 w-4 mr-2" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="analisis" className="flex-1" disabled={!generatedPlan || isGenerating}>
              <FileBarChart className="h-4 w-4 mr-2" />
              Análisis
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="configuracion" className="mt-0 space-y-4">
            <div>
              <Label htmlFor="goal-type">Tipo de Meta</Label>
              <Select
                value={selectedGoalType}
                onValueChange={setSelectedGoalType}
                disabled={isGenerating}
              >
                <SelectTrigger id="goal-type">
                  <SelectValue placeholder="Selecciona un tipo de meta" />
                </SelectTrigger>
                <SelectContent>
                  {goalTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Bloques de Tiempo Preferidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {timeBlocks.map((block) => (
                  <div key={block.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`time-${block.value}`}
                      checked={preferences.preferred_time_blocks.includes(block.value)}
                      onCheckedChange={() => handleTimeBlockToggle(block.value)}
                      disabled={isGenerating}
                    />
                    <label
                      htmlFor={`time-${block.value}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {block.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="difficulty">Preferencia de Dificultad</Label>
              <Select
                value={preferences.difficulty_preference}
                onValueChange={handleDifficultyChange}
                disabled={isGenerating}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Selecciona nivel de dificultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil - Pasos simples y accesibles</SelectItem>
                  <SelectItem value="moderate">Moderado - Retos alcanzables</SelectItem>
                  <SelectItem value="challenging">Desafiante - Objetivos ambiciosos</SelectItem>
                  <SelectItem value="balanced">Equilibrado - Mezcla de desafíos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Áreas Prioritarias</Label>
              <div className="grid grid-cols-2 gap-2">
                {priorityAreas.map((area) => (
                  <div key={area.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`area-${area.value}`}
                      checked={preferences.priority_areas.includes(area.value)}
                      onCheckedChange={() => handlePriorityAreaToggle(area.value)}
                      disabled={isGenerating}
                    />
                    <label
                      htmlFor={`area-${area.value}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {area.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="learning-style">Estilo de Aprendizaje</Label>
              <Select
                value={preferences.learning_style}
                onValueChange={handleLearningStyleChange}
                disabled={isGenerating}
              >
                <SelectTrigger id="learning-style">
                  <SelectValue placeholder="Selecciona estilo de aprendizaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual - Aprendo mejor con imágenes y diagramas</SelectItem>
                  <SelectItem value="auditory">Auditivo - Aprendo mejor escuchando y hablando</SelectItem>
                  <SelectItem value="kinesthetic">Kinestésico - Aprendo mejor haciendo y experimentando</SelectItem>
                  <SelectItem value="balanced">Equilibrado - Combino diferentes estilos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0 space-y-4">
            {generatedPlan ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{generatedPlan.title}</h3>
                  <p className="text-muted-foreground">{generatedPlan.summary}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Insights de Comportamiento</h4>
                  <ul className="space-y-1">
                    {generatedPlan.behavioral_insights.map((insight: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pasos Adaptados</h4>
                  <ScrollArea className="h-52 rounded-md border p-4">
                    <div className="space-y-4">
                      {generatedPlan.adapted_steps.map((step: any, index: number) => (
                        <div key={index} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                          <div className="flex items-start gap-2">
                            <div className="bg-primary/20 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-medium text-sm">{step.title}</h5>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          
                          <div className="ml-7 space-y-1">
                            <div className="text-xs">
                              <span className="font-semibold text-muted-foreground">Por qué funcionará: </span>
                              <span>{step.why_this_works}</span>
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold text-muted-foreground">Cuándo: </span>
                              <span>{step.suggested_timeframe}</span>
                            </div>
                            <div className="text-xs flex items-center gap-1 flex-wrap">
                              <span className="font-semibold text-muted-foreground">Adaptado para: </span>
                              {step.adaptation_factors.map((factor: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[10px] bg-primary/10 px-1">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Posibles Obstáculos</h4>
                  <ul className="space-y-2">
                    {generatedPlan.potential_obstacles.map((obstacle: any, index: number) => (
                      <li key={index} className="text-sm bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md">
                        <div className="font-medium text-orange-800 dark:text-orange-300 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {obstacle.obstacle}
                        </div>
                        <div className="mt-1 text-orange-700 dark:text-orange-200">
                          <span className="font-medium">Estrategia: </span>
                          {obstacle.mitigation_strategy}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aún no hay plan generado</h3>
                <p className="text-muted-foreground mt-1">
                  Configura y genera un plan personalizado en la pestaña de Configuración
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analisis" className="mt-0">
            {generatedPlan ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Mecanismos de Refuerzo</h4>
                  <ul className="space-y-1">
                    {generatedPlan.reinforcement_mechanisms.map((mechanism: string, index: number) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <Dumbbell className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{mechanism}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Seguimiento de Progreso</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                    <div className="text-sm mb-2">
                      <span className="font-medium">Métricas Sugeridas:</span>
                      <ul className="ml-5 list-disc mt-1 space-y-1">
                        {generatedPlan.progress_tracking.suggested_metrics.map((metric: string, index: number) => (
                          <li key={index}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm mb-2">
                      <span className="font-medium">Frecuencia de Revisión:</span>
                      <p className="mt-1">{generatedPlan.progress_tracking.review_cadence}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Señales para Ajustar el Plan:</span>
                      <ul className="ml-5 list-disc mt-1 space-y-1">
                        {generatedPlan.progress_tracking.adaptation_triggers.map((trigger: string, index: number) => (
                          <li key={index}>{trigger}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aún no hay análisis disponible</h3>
                <p className="text-muted-foreground mt-1">
                  Primero debes generar un plan personalizado
                </p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between bg-primary/5 pt-3">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cerrar
          </Button>
        )}
        
        {activeTab === 'configuracion' ? (
          <Button 
            variant="default" 
            onClick={handleGeneratePlan} 
            disabled={!selectedGoalType || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generar Plan Personalizado
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="default" 
            onClick={() => setActiveTab('configuracion')}
          >
            Modificar Configuración
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Brain, Settings, Check, X, RefreshCw, PencilLine, Eye, BarChart3, Zap, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { aiService } from '@/services/ai';

interface LearningAdaptationProps {
  userData: any;
  interactionHistory: any[];
  onClose?: () => void;
  onSettingsUpdated?: (settings: any) => void;
}

export function LearningAdaptation({ userData, interactionHistory, onClose, onSettingsUpdated }: LearningAdaptationProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('preferences');
  const [adaptationResults, setAdaptationResults] = useState<any>(null);
  
  const [preferences, setPreferences] = useState({
    suggestionsFrequency: 2, // 0-none, 1-low, 2-medium, 3-high
    detailLevel: 1, // 0-concise, 1-balanced, 2-detailed
    adaptivitySpeed: 1, // 0-slow, 1-medium, 2-fast
    learningStyle: 'visual', // visual, auditory, reading, kinesthetic
    feedbackType: 'positive', // positive, balanced, critical
    aiPersonality: 'balanced', // friendly, professional, balanced, motivational
    topicPreferences: ['productivity', 'goal-setting', 'habit-building'],
    enableAutonomousLearning: true,
    enableAdvancedPatternRecognition: true,
    enablePersonalizedSuggestions: true,
    enableContextualAwareness: true
  });
  
  const [userInsights, setUserInsights] = useState({
    preferredTimeBlocks: [],
    learningCurve: [],
    topicEngagement: {},
    responsePatterns: {},
    completionRate: 0,
    adaptationScore: 0
  });
  
  // Simular carga de datos iniciales
  useEffect(() => {
    if (!adaptationResults) {
      setUserInsights({
        preferredTimeBlocks: [
          { time: 'morning', score: 0.85 },
          { time: 'afternoon', score: 0.55 },
          { time: 'evening', score: 0.3 }
        ],
        learningCurve: [
          { week: 1, score: 0.2 },
          { week: 2, score: 0.4 },
          { week: 3, score: 0.55 },
          { week: 4, score: 0.7 }
        ],
        topicEngagement: {
          'productivity': 0.85,
          'goal-setting': 0.75,
          'task-management': 0.65,
          'habit-building': 0.9,
          'time-management': 0.7
        },
        responsePatterns: {
          'morning': 'detailed',
          'afternoon': 'balanced',
          'evening': 'concise'
        },
        completionRate: 0.72,
        adaptationScore: 0.65
      });
    }
  }, [adaptationResults]);
  
  // Manejar cambio de preferencias
  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Generar adaptación de aprendizaje
  const handleGenerateAdaptation = async () => {
    setIsLoading(true);
    
    try {
      const response = await aiService.generateLearningAdaptation({
        user_data: userData,
        interaction_history: interactionHistory,
        current_preferences: preferences
      });
      
      if (response && response.adaptation) {
        setAdaptationResults(response.adaptation);
        
        // Actualizar preferencias basadas en recomendaciones
        if (response.adaptation.recommended_settings) {
          const newSettings = response.adaptation.recommended_settings;
          setPreferences(prev => ({
            ...prev,
            ...newSettings
          }));
          
          if (onSettingsUpdated) {
            onSettingsUpdated(newSettings);
          }
        }
        
        toast({
          title: "Adaptación Completada",
          description: "Hemos actualizado tu experiencia de IA basada en tus patrones",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error generando adaptación:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la adaptación de aprendizaje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Aplicar configuraciones recomendadas
  const handleApplyRecommendedSettings = () => {
    if (adaptationResults && adaptationResults.recommended_settings) {
      setPreferences(prev => ({
        ...prev,
        ...adaptationResults.recommended_settings
      }));
      
      if (onSettingsUpdated) {
        onSettingsUpdated(adaptationResults.recommended_settings);
      }
      
      toast({
        title: "Configuraciones Aplicadas",
        description: "Se han aplicado las configuraciones recomendadas",
        variant: "default"
      });
    }
  };
  
  return (
    <Card className="w-full max-w-4xl border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sistema de Aprendizaje Continuo
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        <CardDescription>
          Adaptando la experiencia de IA a tus patrones de interacción y preferencias
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="preferences" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="preferences" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Preferencias
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">
              <BarChart3 className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="adaptations" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Adaptaciones
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="preferences" className="mt-0">
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Frecuencia de Sugerencias</h3>
                    <span className="text-xs text-muted-foreground">
                      {['Ninguna', 'Baja', 'Media', 'Alta'][preferences.suggestionsFrequency]}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.suggestionsFrequency]}
                    min={0}
                    max={3}
                    step={1}
                    onValueChange={(value) => handlePreferenceChange('suggestionsFrequency', value[0])}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Nivel de Detalle</h3>
                    <span className="text-xs text-muted-foreground">
                      {['Conciso', 'Balanceado', 'Detallado'][preferences.detailLevel]}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.detailLevel]}
                    min={0}
                    max={2}
                    step={1}
                    onValueChange={(value) => handlePreferenceChange('detailLevel', value[0])}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Velocidad de Adaptación</h3>
                    <span className="text-xs text-muted-foreground">
                      {['Lenta', 'Media', 'Rápida'][preferences.adaptivitySpeed]}
                    </span>
                  </div>
                  <Slider
                    value={[preferences.adaptivitySpeed]}
                    min={0}
                    max={2}
                    step={1}
                    onValueChange={(value) => handlePreferenceChange('adaptivitySpeed', value[0])}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Estilo de Aprendizaje</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'visual', label: 'Visual', icon: <Eye className="h-4 w-4" /> },
                    { id: 'auditory', label: 'Auditivo', icon: <BookOpen className="h-4 w-4" /> },
                    { id: 'reading', label: 'Lectura', icon: <PencilLine className="h-4 w-4" /> },
                    { id: 'kinesthetic', label: 'Kinestésico', icon: <Zap className="h-4 w-4" /> }
                  ].map(style => (
                    <Button
                      key={style.id}
                      variant={preferences.learningStyle === style.id ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => handlePreferenceChange('learningStyle', style.id)}
                    >
                      {style.icon}
                      <span className="ml-2">{style.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Tipo de Feedback</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'positive', label: 'Positivo' },
                    { id: 'balanced', label: 'Balanceado' },
                    { id: 'critical', label: 'Crítico' }
                  ].map(type => (
                    <Button
                      key={type.id}
                      variant={preferences.feedbackType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceChange('feedbackType', type.id)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Personalidad de IA</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'friendly', label: 'Amigable' },
                    { id: 'professional', label: 'Profesional' },
                    { id: 'balanced', label: 'Balanceada' },
                    { id: 'motivational', label: 'Motivacional' }
                  ].map(personality => (
                    <Button
                      key={personality.id}
                      variant={preferences.aiPersonality === personality.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceChange('aiPersonality', personality.id)}
                    >
                      {personality.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="text-sm font-medium">Configuración Avanzada</h3>
                <div className="space-y-3">
                  {[
                    { id: 'enableAutonomousLearning', label: 'Aprendizaje Autónomo', description: 'El sistema aprende y se adapta automáticamente basado en tus interacciones' },
                    { id: 'enableAdvancedPatternRecognition', label: 'Reconocimiento Avanzado de Patrones', description: 'Detecta y responde a patrones sutiles en tu comportamiento' },
                    { id: 'enablePersonalizedSuggestions', label: 'Sugerencias Personalizadas', description: 'Proporciona recomendaciones específicas basadas en tus hábitos' },
                    { id: 'enableContextualAwareness', label: 'Conciencia Contextual', description: 'Ajusta respuestas basadas en el contexto de la conversación y hora del día' }
                  ].map(setting => (
                    <div key={setting.id} className="flex items-start space-x-3">
                      <Switch
                        checked={preferences[setting.id as keyof typeof preferences] as boolean}
                        onCheckedChange={(checked) => handlePreferenceChange(setting.id, checked)}
                      />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">{setting.label}</h4>
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="mt-0">
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-2">
                <div className="col-span-2 flex items-center justify-between bg-primary/5 p-4 rounded-md">
                  <div className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-sm font-medium">Puntaje de Adaptación</h3>
                      <p className="text-xs text-muted-foreground">Qué tan bien el sistema se ha adaptado a ti</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(userInsights.adaptationScore * 100)}%
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Tasa de Completamiento
                  </h3>
                  <div className="text-xl font-bold">
                    {Math.round(userInsights.completionRate * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    De tareas propuestas por la IA
                  </p>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md">
                  <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Estilo de Aprendizaje
                  </h3>
                  <div className="text-xl font-bold capitalize">
                    {preferences.learningStyle}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adaptando contenido a tu estilo
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Bloques de Tiempo Preferidos</h3>
                <div className="space-y-2">
                  {userInsights.preferredTimeBlocks.map((block, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{block.time}</span>
                        <span>{Math.round(block.score * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${block.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Compromiso por Tema</h3>
                <div className="space-y-2">
                  {Object.entries(userInsights.topicEngagement).map(([topic, score], index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{topic.replace(/-/g, ' ')}</span>
                        <span>{Math.round(score as number * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${(score as number) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Patrones de Respuesta</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(userInsights.responsePatterns).map(([timeOfDay, style], index) => (
                    <div key={index} className="bg-primary/5 p-3 rounded-md">
                      <h4 className="text-xs font-medium capitalize">{timeOfDay}</h4>
                      <p className="text-sm font-medium mt-1 capitalize">{style}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="adaptations" className="mt-0">
            {!adaptationResults ? (
              <div className="text-center py-10">
                <RefreshCw className="h-10 w-10 text-primary/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ninguna Adaptación Generada</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Genera una adaptación personalizada basada en tus preferencias y patrones de interacción.
                </p>
                
                <Button 
                  onClick={handleGenerateAdaptation} 
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generar Adaptación
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="bg-primary/5 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Resumen de Adaptación</h3>
                  <p className="text-sm">{adaptationResults.summary}</p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Recomendaciones Personalizadas</h3>
                  
                  <ScrollArea className="h-64 rounded-md border p-4">
                    {adaptationResults.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="mb-4 pb-4 border-b border-border last:border-0 last:pb-0 last:mb-0">
                        <div className="flex items-start gap-2">
                          <div className="bg-primary/10 text-primary p-2 rounded-md flex-shrink-0">
                            <Lightbulb className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">{rec.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                
                {adaptationResults.recommended_settings && (
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">Configuraciones Recomendadas</h3>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={handleApplyRecommendedSettings}
                      >
                        <Check className="h-3 w-3" />
                        Aplicar
                      </Button>
                    </div>
                    
                    <div className="grid gap-y-3">
                      {Object.entries(adaptationResults.recommended_settings).map(([key, value], index) => {
                        // Solo mostrar cambios
                        if (JSON.stringify(preferences[key as keyof typeof preferences]) === JSON.stringify(value)) {
                          return null;
                        }
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {key.replace(/([A-Z])/g, ' $1')
                               .replace(/^./, str => str.toUpperCase())
                               .replace(/([a-z])([A-Z])/g, '$1 $2')}:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground">
                                {typeof preferences[key as keyof typeof preferences] === 'boolean'
                                  ? (preferences[key as keyof typeof preferences] ? 'Activado' : 'Desactivado')
                                  : typeof preferences[key as keyof typeof preferences] === 'number'
                                      ? preferences[key as keyof typeof preferences]
                                      : String(preferences[key as keyof typeof preferences])}
                              </span>
                              <span>→</span>
                              <Badge variant="outline" className="text-primary">
                                {typeof value === 'boolean'
                                  ? (value ? 'Activado' : 'Desactivado')
                                  : typeof value === 'number'
                                      ? value
                                      : String(value)}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleGenerateAdaptation} 
                    disabled={isLoading}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Regenerar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between bg-primary/5 pt-3">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
        
        <Button 
          variant="default" 
          onClick={() => {
            if (onSettingsUpdated) {
              onSettingsUpdated(preferences);
            }
            
            toast({
              title: "Preferencias Guardadas",
              description: "Tus preferencias han sido guardadas correctamente",
              variant: "default"
            });
            
            if (onClose) {
              onClose();
            }
          }}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Guardar Preferencias
        </Button>
      </CardFooter>
    </Card>
  );
} 
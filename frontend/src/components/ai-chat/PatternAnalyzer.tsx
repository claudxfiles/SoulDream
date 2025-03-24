'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Clock, FileBarChart, AlertCircle, Lightbulb, LineChart, BarChart, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { aiService, PatternAnalysisRequest } from '@/services/ai';

interface PatternAnalyzerProps {
  userData: any;
  onClose?: () => void;
  onAnalysisComplete?: (analysis: any) => void;
}

export function PatternAnalyzer({ userData, onClose, onAnalysisComplete }: PatternAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('temporal');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Función para iniciar el análisis de patrones
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulamos progreso incremental durante el análisis
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      const request: PatternAnalysisRequest = {
        user_data: userData
      };
      
      const response = await aiService.analyzePatterns(request);
      
      if (response && response.pattern_analysis) {
        setAnalysisResults(response.pattern_analysis);
        setAnalysisProgress(100);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(response.pattern_analysis);
        }
        
        toast({
          title: "Análisis Completado",
          description: "Se han identificado patrones en tus datos",
          variant: "default"
        });
      } else {
        throw new Error("Formato de respuesta inválido");
      }
    } catch (error) {
      console.error("Error en el análisis de patrones:", error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis de patrones. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setAnalysisProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  // Función para renderizar el indicador de confianza
  const renderConfidence = (confidence: number) => {
    let color = 'bg-green-500';
    if (confidence < 0.5) color = 'bg-red-500';
    else if (confidence < 0.8) color = 'bg-yellow-500';
    
    return (
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Confianza:</span>
        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color}`}
            style={{ width: `${confidence * 100}%` }}
          ></div>
        </div>
        <span className="text-xs">{Math.round(confidence * 100)}%</span>
      </div>
    );
  };
  
  // Renderizado basado en el estado de análisis
  if (!analysisResults && !isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Análisis Avanzado de Patrones
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
          <CardDescription>
            Descubre patrones en tu comportamiento y productividad
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 pb-6 text-center">
          <Brain className="h-16 w-16 text-primary/70 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Análisis de Patrones con IA</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Analizaremos tus datos históricos para identificar patrones temporales, de comportamiento, 
            factores de éxito y recomendaciones personalizadas.
          </p>
          
          <Button 
            onClick={handleStartAnalysis} 
            className="gap-2"
            size="lg"
          >
            <Activity className="h-4 w-4" />
            Iniciar Análisis de Patrones
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Renderizado durante el análisis
  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Analizando patrones...
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} disabled={true}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-8 pb-8 text-center">
          <div className="h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-6"></div>
          <h3 className="text-lg font-medium mb-2">Análisis en progreso</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Estamos analizando tus datos para identificar patrones y tendencias significativas...
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Progreso del análisis</span>
              <span className="text-sm font-medium">{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Renderizado de los resultados del análisis
  return (
    <Card className="w-full max-w-4xl border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Resultados del Análisis de Patrones
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        <CardDescription>
          {analysisResults.summary}
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="temporal" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="temporal" className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Temporal
            </TabsTrigger>
            <TabsTrigger value="behavioral" className="flex-1">
              <Activity className="h-4 w-4 mr-2" />
              Comportamiento
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex-1">
              <FileBarChart className="h-4 w-4 mr-2" />
              Factores
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-4">
          <TabsContent value="temporal" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Patrones Temporales</h3>
              <ScrollArea className="h-96 rounded-md border p-4">
                {analysisResults.temporal_patterns.map((pattern: any, index: number) => (
                  <div key={index} className="mb-5 pb-5 border-b border-border last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-start gap-2">
                      <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 p-2 rounded-md flex-shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        {renderConfidence(pattern.confidence)}
                        
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Evidencia:</h5>
                          <ul className="text-sm space-y-1">
                            {pattern.evidence.map((evidence: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {evidence}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-3 bg-primary/5 p-2 rounded-md">
                          <h5 className="text-xs font-medium flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-primary" />
                            Recomendación:
                          </h5>
                          <p className="text-sm mt-1">{pattern.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="behavioral" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Patrones de Comportamiento</h3>
              <ScrollArea className="h-96 rounded-md border p-4">
                {analysisResults.behavioral_patterns.map((pattern: any, index: number) => (
                  <div key={index} className="mb-5 pb-5 border-b border-border last:border-0 last:pb-0 last:mb-0">
                    <div className="flex items-start gap-2">
                      <div className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 p-2 rounded-md flex-shrink-0">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{pattern.pattern}</h4>
                        {renderConfidence(pattern.confidence)}
                        
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Evidencia:</h5>
                          <ul className="text-sm space-y-1">
                            {pattern.evidence.map((evidence: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {evidence}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mt-3 bg-primary/5 p-2 rounded-md">
                          <h5 className="text-xs font-medium flex items-center gap-1">
                            <Lightbulb className="h-3 w-3 text-primary" />
                            Recomendación:
                          </h5>
                          <p className="text-sm mt-1">{pattern.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="factors" className="mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  Factores de Éxito
                </h3>
                <ScrollArea className="h-44 rounded-md border p-4 mt-2">
                  {analysisResults.success_factors.map((factor: any, index: number) => (
                    <div key={index} className="mb-4 pb-4 border-b border-border last:border-0 last:pb-0 last:mb-0">
                      <div className="flex items-start gap-2">
                        <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 p-2 rounded-md flex-shrink-0">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{factor.factor}</h4>
                          {renderConfidence(factor.confidence)}
                          
                          <div className="mt-2">
                            <p className="text-sm">{factor.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  Factores de Fracaso
                </h3>
                <ScrollArea className="h-44 rounded-md border p-4 mt-2">
                  {analysisResults.failure_factors.map((factor: any, index: number) => (
                    <div key={index} className="mb-4 pb-4 border-b border-border last:border-0 last:pb-0 last:mb-0">
                      <div className="flex items-start gap-2">
                        <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-2 rounded-md flex-shrink-0">
                          <ArrowDownRight className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{factor.factor}</h4>
                          {renderConfidence(factor.confidence)}
                          
                          <div className="mt-2">
                            <p className="text-sm">{factor.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Insights Clave</h3>
              
              <div className="grid gap-4">
                {analysisResults.key_insights.map((insight: string, index: number) => (
                  <div key={index} className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
          onClick={handleStartAnalysis}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          Actualizar Análisis
        </Button>
      </CardFooter>
    </Card>
  );
} 
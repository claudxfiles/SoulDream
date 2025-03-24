'use client';

import React from 'react';
import { AiChatInterface } from '@/components/ai-chat/AiChatInterface';
import {
  Brain,
  Sparkles,
  Bot,
  MessageSquare,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AIAssistantPage() {
  return (
    <div className="p-4">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistente IA Avanzado</h1>
        </div>
        <p className="text-muted-foreground mt-1 ml-9">
          Tu asistente inteligente con análisis avanzado de patrones y aprendizaje continuo
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Características Avanzadas de IA
            </CardTitle>
            <CardDescription>
              Experimenta el poder de la inteligencia artificial avanzada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 bg-background/80 p-3 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Generador de Planes Personalizados</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crea planes adaptados a tus hábitos, preferencias y objetivos
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-background/80 p-3 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Análisis Avanzado de Patrones</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Descubre insights sobre tus hábitos y comportamientos para mejorar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-background/80 p-3 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Aprendizaje Continuo</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sistema que se adapta a tus preferencias y patrones de interacción
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[calc(100vh-16rem)]">
        <AiChatInterface />
      </div>
    </div>
  );
} 
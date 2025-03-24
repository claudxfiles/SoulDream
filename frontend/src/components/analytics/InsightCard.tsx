"use client";

import React from 'react';
import { AIInsight } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Activity, 
  DollarSign,
  Target,
  Zap
} from 'lucide-react';

interface InsightCardProps {
  insight: AIInsight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  // Obtener el icono según el tipo de insight
  const getIcon = () => {
    switch (insight.insight_type) {
      case 'productivity':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'habits':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'financial':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'goal_achievement':
        return <Target className="h-5 w-5 text-yellow-500" />;
      case 'time_management':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  // Obtener color según el tipo
  const getTypeColor = () => {
    switch (insight.insight_type) {
      case 'productivity':
        return 'bg-blue-100 text-blue-800';
      case 'habits':
        return 'bg-purple-100 text-purple-800';
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'goal_achievement':
        return 'bg-yellow-100 text-yellow-800';
      case 'time_management':
        return 'bg-orange-100 text-orange-800';
      case 'prediction':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener el título según el tipo
  const getTypeTitle = () => {
    switch (insight.insight_type) {
      case 'productivity':
        return 'Productividad';
      case 'habits':
        return 'Hábitos';
      case 'financial':
        return 'Finanzas';
      case 'goal_achievement':
        return 'Metas';
      case 'time_management':
        return 'Gestión del Tiempo';
      case 'prediction':
        return 'Predicción';
      default:
        return 'Insight';
    }
  };

  return (
    <Card className={`border-l-4 ${getBorderColor(insight.relevance)} ${className || ''}`}>
      <CardHeader className="pb-2 pt-4 flex flex-row items-start gap-4">
        <div className="mt-1">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <Badge className={`${getTypeColor()} font-normal mb-2`}>
              {getTypeTitle()}
            </Badge>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <CardTitle className="text-lg font-medium">{insight.description}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <InsightDetails insight={insight} />
      </CardContent>
    </Card>
  );
}

function InsightDetails({ insight }: { insight: AIInsight }) {
  // Renderizar diferentes visualizaciones según el tipo de insight
  if (!insight.data) return null;
  
  switch (insight.insight_type) {
    case 'productivity':
      return (
        <div className="mt-2 text-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold">{(insight.data as any).thisWeek}</div>
              <div className="text-xs text-gray-500">Esta semana</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-semibold">{(insight.data as any).lastWeek}</div>
              <div className="text-xs text-gray-500">Semana pasada</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="font-semibold text-green-600">+{(insight.data as any).improvement}%</div>
              <div className="text-xs text-gray-500">Mejora</div>
            </div>
          </div>
        </div>
      );
    // Puedes agregar más casos según los tipos de insights que manejes
    default:
      return (
        <div className="mt-2 text-sm text-gray-600">
          {JSON.stringify(insight.data)}
        </div>
      );
  }
}

// Obtener color del borde según la relevancia
function getBorderColor(relevance: number | null): string {
  if (!relevance) return 'border-l-gray-300';
  
  if (relevance >= 90) return 'border-l-red-500';
  if (relevance >= 80) return 'border-l-orange-500';
  if (relevance >= 70) return 'border-l-yellow-500';
  if (relevance >= 60) return 'border-l-green-500';
  if (relevance >= 50) return 'border-l-blue-500';
  return 'border-l-gray-400';
} 
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { InsightCard } from './InsightCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, Zap } from 'lucide-react';
import { AIInsight } from '@/types/analytics';
import { fetchInsights } from '@/lib/api';

export function AllInsights() {
  const { data: insights, isLoading, error } = useQuery<AIInsight[]>({
    queryKey: ['insights'],
    queryFn: fetchInsights
  });

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-center text-red-500">
        Error al cargar los insights
      </div>
    );
  }

  const productivityInsights = insights?.filter(i => i.insight_type === 'productivity') || [];
  const financialInsights = insights?.filter(i => i.insight_type === 'financial') || [];
  const habitsInsights = insights?.filter(i => i.insight_type === 'habits') || [];

  return (
    <div className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all" className="text-sm">
            Todos los Insights
          </TabsTrigger>
          <TabsTrigger value="productivity" className="text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Productividad
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-sm">
            <DollarSign className="w-4 h-4 mr-2" />
            Finanzas
          </TabsTrigger>
          <TabsTrigger value="habits" className="text-sm">
            <Zap className="w-4 h-4 mr-2" />
            Hábitos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {insights?.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          {productivityInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
          {productivityInsights.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hay insights de productividad disponibles
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {financialInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
          {financialInsights.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hay insights financieros disponibles
            </div>
          )}
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          {habitsInsights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
          {habitsInsights.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No hay insights de hábitos disponibles
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
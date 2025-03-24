'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';
import { TransactionManager } from '@/components/finance/TransactionManager';
import { SubscriptionManager } from '@/components/finance/SubscriptionManager';
import { AssetPlanner } from '@/components/finance/AssetPlanner';
import { SavingsCalculator } from '@/components/finance/SavingsCalculator';
import { FinancialEducation } from '@/components/finance/FinancialEducation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  CreditCard, 
  Receipt, 
  Home, 
  Calculator, 
  BookOpen, 
  ArrowRight 
} from 'lucide-react';

export default function FinancePage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Sincronizar pestaña activa con parámetro de URL
  useEffect(() => {
    if (tabParam) {
      const validTabs = ['dashboard', 'transactions', 'subscriptions', 'assets', 'calculator', 'education'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [tabParam]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestión Financiera</h1>
        <p className="text-muted-foreground">
          Administra tus finanzas, planifica tus ahorros y alcanza tus metas económicas.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted h-12 w-full justify-start gap-0 rounded-none border-b dark:border-gray-800 p-0">
          <TabsTrigger 
            value="dashboard" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <PieChart className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <Receipt className="h-4 w-4" />
            <span>Transacciones</span>
          </TabsTrigger>
          <TabsTrigger 
            value="subscriptions" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <CreditCard className="h-4 w-4" />
            <span>Suscripciones</span>
          </TabsTrigger>
          <TabsTrigger 
            value="assets" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <Home className="h-4 w-4" />
            <span>Activos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calculator" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <Calculator className="h-4 w-4" />
            <span>Calculadora</span>
          </TabsTrigger>
          <TabsTrigger 
            value="education" 
            className="flex h-12 items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary"
          >
            <BookOpen className="h-4 w-4" />
            <span>Educación</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <FinanceDashboard />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-6">
          <TransactionManager />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionManager />
        </TabsContent>
        
        <TabsContent value="assets" className="space-y-6">
          <AssetPlanner />
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-6">
          <SavingsCalculator />
        </TabsContent>
        
        <TabsContent value="education" className="space-y-6">
          <FinancialEducation />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
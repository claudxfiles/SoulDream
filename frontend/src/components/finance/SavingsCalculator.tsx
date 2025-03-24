'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { calculateCompoundInterest } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  PieChart,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Componente para calcular ahorros e interés compuesto
export function SavingsCalculator() {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<string>('ahorro');
  
  // Estados para calculadora de ahorro
  const [income, setIncome] = useState<number>(3000);
  const [expenses, setExpenses] = useState<number>(2000);
  const [savingsRate, setSavingsRate] = useState<number>(20);
  const [targetAmount, setTargetAmount] = useState<string>('10000');
  const [savingsResult, setSavingsResult] = useState<{
    monthly: number;
    timeToTarget: number;
    totalSaved: number;
  }>({ monthly: 0, timeToTarget: 0, totalSaved: 0 });

  // Estados para calculadora de interés compuesto
  const [initialInvestment, setInitialInvestment] = useState<string>('1000');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('100');
  const [interestRate, setInterestRate] = useState<number>(8);
  const [timeYears, setTimeYears] = useState<number>(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState<string>('12');
  const [investmentResult, setInvestmentResult] = useState<{
    finalAmount: number;
    totalContributions: number;
    interestEarned: number;
    yearlyBreakdown: { year: number; amount: number; contributions: number; interest: number }[];
  }>({
    finalAmount: 0,
    totalContributions: 0,
    interestEarned: 0,
    yearlyBreakdown: []
  });

  // Calcular resultados para el ahorro
  useEffect(() => {
    // Calcular ahorro mensual recomendado basado en ingresos y tasa de ahorro
    const availableForSaving = income - expenses;
    const recommendedMonthlySaving = Math.round((income * savingsRate) / 100);
    
    // No permitir más ahorro que el disponible
    const actualMonthlySaving = Math.min(recommendedMonthlySaving, availableForSaving);
    
    // Calcular tiempo para alcanzar el objetivo
    const targetAmountNum = parseFloat(targetAmount) || 0;
    let timeToTarget = actualMonthlySaving > 0 ? Math.ceil(targetAmountNum / actualMonthlySaving) : 0;
    
    // Establecer resultados
    setSavingsResult({
      monthly: actualMonthlySaving,
      timeToTarget: timeToTarget,
      totalSaved: actualMonthlySaving * timeToTarget
    });
  }, [income, expenses, savingsRate, targetAmount]);

  // Calcular resultados para la inversión
  useEffect(() => {
    const initialAmount = parseFloat(initialInvestment) || 0;
    const monthlyAmount = parseFloat(monthlyContribution) || 0;
    const years = timeYears;
    const rate = interestRate / 100;
    const frequency = parseInt(compoundingFrequency) || 12;
    
    // Calcular crecimiento año por año
    let currentAmount = initialAmount;
    let totalContributed = initialAmount;
    const yearlyData = [];
    
    for (let year = 1; year <= years; year++) {
      const startYearAmount = currentAmount;
      
      // Aplicar aportes mensuales y crecimiento para este año
      for (let month = 1; month <= 12; month++) {
        currentAmount += monthlyAmount;
        totalContributed += monthlyAmount;
        
        // Aplicar interés según la frecuencia
        if (month % (12 / frequency) === 0) {
          currentAmount *= (1 + rate / frequency);
        }
      }
      
      yearlyData.push({
        year,
        amount: currentAmount,
        contributions: totalContributed,
        interest: currentAmount - totalContributed
      });
    }
    
    setInvestmentResult({
      finalAmount: currentAmount,
      totalContributions: totalContributed,
      interestEarned: currentAmount - totalContributed,
      yearlyBreakdown: yearlyData
    });
  }, [initialInvestment, monthlyContribution, interestRate, timeYears, compoundingFrequency]);

  // Formatear dinero
  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Renderizar gráfico simplificado del crecimiento (barra de progreso)
  const renderGrowthChart = () => {
    if (!investmentResult.yearlyBreakdown.length) return null;
    
    return (
      <div className="mt-4 space-y-2">
        {investmentResult.yearlyBreakdown
          .filter((item, index) => index % 2 === 0 || index === investmentResult.yearlyBreakdown.length - 1) // Mostrar cada 2 años y el último
          .map((data) => {
            const contributionPercentage = (data.contributions / data.amount) * 100;
            const interestPercentage = 100 - contributionPercentage;
            
            return (
              <div key={data.year} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Año {data.year}</span>
                  <span>{formatMoney(data.amount)}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary flex"
                    style={{ width: '100%' }}
                  >
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${contributionPercentage}%` }}
                    ></div>
                    <div 
                      className="h-full bg-green-600" 
                      style={{ width: `${interestPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        <div className="flex justify-between text-xs mt-1">
          <span className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
            <span>Aportes</span>
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
            <span>Intereses generados</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calculadora de Ahorro Inteligente</h2>
        <p className="text-muted-foreground">
          Planifica tus ahorros y simula el crecimiento de tus inversiones
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="ahorro">Plan de Ahorro</TabsTrigger>
          <TabsTrigger value="inversion">Interés Compuesto</TabsTrigger>
        </TabsList>

        {/* Calculadora de ahorro */}
        <TabsContent value="ahorro" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calculadora de ahorro */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Plan de Ahorro Personal</CardTitle>
                <CardDescription>
                  Calcula cuánto deberías ahorrar mensualmente según tus ingresos y gastos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="income">Ingresos mensuales</Label>
                    <span className="text-sm text-muted-foreground">{formatMoney(income)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="income"
                      value={[income]}
                      min={0}
                      max={10000}
                      step={100}
                      onValueChange={(values) => setIncome(values[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="expenses">Gastos mensuales</Label>
                    <span className="text-sm text-muted-foreground">{formatMoney(expenses)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="expenses"
                      value={[expenses]}
                      min={0}
                      max={income}
                      step={100}
                      onValueChange={(values) => setExpenses(values[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="savingsRate">Porcentaje de ahorro sugerido</Label>
                    <span className="text-sm text-muted-foreground">{savingsRate}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="savingsRate"
                      value={[savingsRate]}
                      min={5}
                      max={50}
                      step={1}
                      onValueChange={(values) => setSavingsRate(values[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="targetAmount">Meta de ahorro</Label>
                    <TooltipProvider>
                      <TooltipRoot>
                        <TooltipTrigger asChild>
                          <button type="button">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Cantidad que deseas ahorrar en total</p>
                        </TooltipContent>
                      </TooltipRoot>
                    </TooltipProvider>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="targetAmount"
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados del ahorro */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  Basado en tus datos actuales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Ahorro mensual recomendado</p>
                  <p className="text-3xl font-bold text-primary">{formatMoney(savingsResult.monthly)}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Tiempo para alcanzar tu meta</p>
                      <p className="text-sm text-muted-foreground">
                        {savingsResult.timeToTarget} meses 
                        ({Math.floor(savingsResult.timeToTarget / 12)} años y {savingsResult.timeToTarget % 12} meses)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Capacidad de ahorro</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(income - expenses)} disponible mensualmente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Recuerda: un 20% de tus ingresos es un buen objetivo de ahorro.
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Calculadora de interés compuesto */}
        <TabsContent value="inversion" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario de interés compuesto */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Calculadora de Interés Compuesto</CardTitle>
                <CardDescription>
                  Simula el crecimiento de tus inversiones a largo plazo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialInvestment">Inversión inicial</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="initialInvestment"
                        type="number"
                        value={initialInvestment}
                        onChange={(e) => setInitialInvestment(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthlyContribution">Aporte mensual</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="monthlyContribution"
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="interestRate">Tasa de interés anual</Label>
                    <span className="text-sm text-muted-foreground">{interestRate}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="interestRate"
                      value={[interestRate]}
                      min={1}
                      max={20}
                      step={0.5}
                      onValueChange={(values) => setInterestRate(values[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="timeYears">Plazo (años)</Label>
                    <span className="text-sm text-muted-foreground">{timeYears} años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      id="timeYears"
                      value={[timeYears]}
                      min={1}
                      max={40}
                      step={1}
                      onValueChange={(values) => setTimeYears(values[0])}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compoundingFrequency">Frecuencia de capitalización</Label>
                  <Select 
                    value={compoundingFrequency} 
                    onValueChange={setCompoundingFrequency}
                  >
                    <SelectTrigger id="compoundingFrequency">
                      <SelectValue placeholder="Selecciona la frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Anual</SelectItem>
                      <SelectItem value="2">Semestral</SelectItem>
                      <SelectItem value="4">Trimestral</SelectItem>
                      <SelectItem value="12">Mensual</SelectItem>
                      <SelectItem value="365">Diaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Resultados del interés compuesto */}
            <Card>
              <CardHeader>
                <CardTitle>Proyección de inversión</CardTitle>
                <CardDescription>
                  En {timeYears} años
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monto final proyectado</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatMoney(investmentResult.finalAmount)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aportes totales</p>
                    <p className="font-medium">
                      {formatMoney(investmentResult.totalContributions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Intereses generados</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {formatMoney(investmentResult.interestEarned)}
                    </p>
                  </div>
                </div>
                
                {/* Gráfico simplificado */}
                {renderGrowthChart()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
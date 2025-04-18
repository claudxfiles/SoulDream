'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/hooks/useFinance';
import { Loader2 } from 'lucide-react';
import { FinancialSummary } from '@/lib/finance';

interface InvestmentResult {
  finalAmount: number;
  totalContributions: number;
  interestEarned: number;
  yearlyProjections: Array<{
    year: number;
    amount: number;
    contributions: number;
    interest: number;
  }>;
}

interface MonthlyData {
  income: number;
  expenses: number;
  subscriptionsTotal: number;
  savings: number;
  savingsRate: number;
}

export const SavingsCalculator = () => {
  const { summary, loading } = useFinance();

  // Función para obtener datos guardados del localStorage
  const getSavedData = () => {
    const savedData = localStorage.getItem('savingsCalculatorData');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return null;
  };

  // Función para guardar datos en localStorage
  const saveData = (data: { savingsRate: number; targetAmount: number }) => {
    localStorage.setItem('savingsCalculatorData', JSON.stringify(data));
  };

  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    income: 1800,
    expenses: 320,
    subscriptionsTotal: 0,
    savings: (1800 * 18) / 100,
    savingsRate: 18
  });

  // Obtener el porcentaje guardado o usar 18 como valor por defecto
  const savedData = getSavedData();
  const [targetAmount, setTargetAmount] = useState(savedData?.targetAmount || 0);
  const [savingsRate, setSavingsRate] = useState(savedData?.savingsRate || 18);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Estados para el interés compuesto
  const [initialInvestment, setInitialInvestment] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [interestRate, setInterestRate] = useState(8);
  const [investmentYears, setInvestmentYears] = useState(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState('anual');
  const [investmentResult, setInvestmentResult] = useState<InvestmentResult>({
    finalAmount: 0,
    totalContributions: 0,
    interestEarned: 0,
    yearlyProjections: []
  });

  // Actualizar datos cuando cambie el resumen financiero
  useEffect(() => {
    if (summary) {
      // Mantener el porcentaje de ahorro independiente
      const currentSavingsRate = getSavedData()?.savingsRate || 18;
      setMonthlyData({
        income: summary.income,
        expenses: summary.expenses,
        subscriptionsTotal: summary.subscriptionsTotal,
        savingsRate: currentSavingsRate,
        savings: (summary.income * currentSavingsRate) / 100
      });
      setSavingsRate(currentSavingsRate);
    }
  }, [summary]);

  // Actualizar cuando cambie el porcentaje de ahorro
  useEffect(() => {
    // Guardar en localStorage
    saveData({
      savingsRate,
      targetAmount
    });

    // Actualizar monthlyData usando el porcentaje configurado
    setMonthlyData(prev => ({
      ...prev,
      savingsRate: savingsRate,
      savings: (prev.income * savingsRate) / 100
    }));
  }, [savingsRate, targetAmount]);

  // Calcular meses para alcanzar la meta
  const calculateMonthsToGoal = () => {
    if (!targetAmount || !monthlyData.savings) return 0;
    return Math.ceil(targetAmount / monthlyData.savings);
  };

  // Formatear tiempo en años y meses
  const formatTimeToGoal = () => {
    const totalMonths = calculateMonthsToGoal();
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    if (years > 0) {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  };

  // Calcular interés compuesto
  const calculateCompoundInterest = () => {
    const getPeriodsPerYear = (frequency: string) => {
      switch (frequency) {
        case 'diaria': return 365;
        case 'mensual': return 12;
        case 'trimestral': return 4;
        case 'semestral': return 2;
        case 'anual': return 1;
        default: return 1;
      }
    };

    const periodsPerYear = getPeriodsPerYear(compoundingFrequency);
    const periodicRate = interestRate / (100 * periodsPerYear);
    
    let balance = initialInvestment;
    let totalContributions = initialInvestment;
    const projections = [];

    for (let year = 1; year <= investmentYears; year++) {
      for (let period = 1; period <= periodsPerYear; period++) {
        // Calcular cuántos aportes mensuales hay en este período
        const monthsPerPeriod = 12 / periodsPerYear;
        const contributionPerPeriod = monthlyContribution * monthsPerPeriod;
        
        // Aplicar el interés al balance actual y sumar el aporte del período
        balance = (balance + contributionPerPeriod) * (1 + periodicRate);
        totalContributions += contributionPerPeriod;
      }

      projections.push({
        year,
        amount: balance,
        contributions: totalContributions,
        interest: balance - totalContributions
      });
    }

    setInvestmentResult({
      finalAmount: balance,
      totalContributions,
      interestEarned: balance - totalContributions,
      yearlyProjections: projections
    });
  };

  // Calcular cuando cambien los parámetros
  useEffect(() => {
    calculateCompoundInterest();
  }, [initialInvestment, monthlyContribution, interestRate, investmentYears, compoundingFrequency]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calculadora de Ahorro Inteligente</h2>
        <p className="text-muted-foreground">
          Planifica tus ahorros y simula el crecimiento de tus inversiones
        </p>
      </div>

      <Tabs defaultValue="real" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="real">Plan de Ahorro Real</TabsTrigger>
          <TabsTrigger value="simulated">Plan de Ahorro Simulado</TabsTrigger>
          <TabsTrigger value="compound">Interés Compuesto</TabsTrigger>
        </TabsList>

        <TabsContent value="real">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan de Ahorro Real</CardTitle>
                <CardDescription>
                  Basado en tus ingresos y gastos reales registrados en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMonthly ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-2">
                      <Label>Ingreso Mensual</Label>
                      <div className="text-2xl font-bold">
                        ${monthlyData.income.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total de ingresos registrados este mes
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label>Gastos Mensuales</Label>
                      <div className="text-2xl font-bold text-destructive">
                        ${monthlyData.expenses.toFixed(2)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Gastos regulares:</span>
                          <span>${(monthlyData.expenses - monthlyData.subscriptionsTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Suscripciones:</span>
                          <span>${monthlyData.subscriptionsTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Porcentaje de ahorro sugerido</Label>
                        <span className="text-muted-foreground">{savingsRate}%</span>
                      </div>
                      <Slider
                        value={[savingsRate]}
                        onValueChange={([value]) => setSavingsRate(value)}
                        max={50}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Meta de ahorro</Label>
                      <div className="flex space-x-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(Number(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Basado en tus datos reales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">
                      ${monthlyData.savings.toFixed(2)}
                    </h3>
                    <p className="text-muted-foreground">Ahorro mensual actual</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Capacidad de ahorro</span>
                    </div>
                    <p>${monthlyData.savings.toFixed(2)} disponible mensualmente</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Tasa de ahorro actual</span>
                    </div>
                    <p>{savingsRate}% de tus ingresos</p>
                  </div>

                  {targetAmount > 0 && monthlyData.savings > 0 && (
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Tiempo para alcanzar tu meta</span>
                      </div>
                      <p>
                        {Math.floor((targetAmount - monthlyData.savings) / monthlyData.savings)} meses
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {savingsRate >= 20 
                        ? '¡Excelente! Estás alcanzando la meta recomendada de ahorro del 20%'
                        : 'Se recomienda ahorrar al menos el 20% de tus ingresos mensuales'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="simulated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan de Ahorro Personal</CardTitle>
                <CardDescription>
                  Calcula cuánto deberías ahorrar mensualmente según tus ingresos y gastos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Ingresos mensuales</Label>
                      <span className="text-muted-foreground">{monthlyData.income} US$</span>
                    </div>
                    <Slider
                      value={[monthlyData.income]}
                      onValueChange={([value]) => setMonthlyData(prev => ({ ...prev, income: value }))}
                      max={10000}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Gastos mensuales</Label>
                      <span className="text-muted-foreground">{monthlyData.expenses} US$</span>
                    </div>
                    <Slider
                      value={[monthlyData.expenses]}
                      onValueChange={([value]) => setMonthlyData(prev => ({ ...prev, expenses: value }))}
                      max={monthlyData.income}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Porcentaje de ahorro sugerido</Label>
                      <span className="text-muted-foreground">{savingsRate}%</span>
                    </div>
                    <Slider
                      value={[savingsRate]}
                      onValueChange={([value]) => setSavingsRate(value)}
                      max={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Meta de ahorro</Label>
                    <div className="flex space-x-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Basado en tus datos actuales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {monthlyData.savings.toFixed(0)} US$
                    </h3>
                    <p className="text-muted-foreground">Ahorro mensual recomendado</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Tiempo para alcanzar tu meta</span>
                    </div>
                    <p>{formatTimeToGoal()}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Capacidad de ahorro</span>
                    </div>
                    <p>{monthlyData.income - monthlyData.expenses} US$ disponible mensualmente</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Recuerda: un 20% de tus ingresos es un buen objetivo de ahorro.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compound">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculadora de Interés Compuesto</CardTitle>
                <CardDescription>
                  Simula el crecimiento de tus inversiones a largo plazo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inversión inicial</Label>
                      <div className="flex space-x-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={initialInvestment}
                          onChange={(e) => setInitialInvestment(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Aporte mensual</Label>
                      <div className="flex space-x-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={monthlyContribution}
                          onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Tasa de interés anual</Label>
                      <span className="text-muted-foreground">{interestRate}%</span>
                    </div>
                    <Slider
                      value={[interestRate]}
                      onValueChange={([value]) => setInterestRate(value)}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Plazo (años)</Label>
                      <span className="text-muted-foreground">{investmentYears} años</span>
                    </div>
                    <Slider
                      value={[investmentYears]}
                      onValueChange={([value]) => setInvestmentYears(value)}
                      min={1}
                      max={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frecuencia de capitalización</Label>
                    <Select
                      value={compoundingFrequency}
                      onValueChange={setCompoundingFrequency}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="diaria">Diaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyección de inversión</CardTitle>
                <CardDescription>En {investmentYears} años</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {investmentResult.finalAmount.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </h3>
                    <p className="text-muted-foreground">Monto final proyectado</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Aportes totales</p>
                      <p className="text-muted-foreground">
                        {investmentResult.totalContributions.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Intereses generados</p>
                      <p className="text-muted-foreground">
                        {investmentResult.interestEarned.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {investmentResult.yearlyProjections.map((projection, index) => {
                      const totalAmount = projection.amount;
                      const contributionsWidth = (projection.contributions / totalAmount) * 100;
                      const interestWidth = (projection.interest / totalAmount) * 100;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Año {projection.year}</span>
                            <span>
                              {totalAmount.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              })}
                            </span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                            <div
                              className="bg-blue-500"
                              style={{ width: `${contributionsWidth}%` }}
                            />
                            <div
                              className="bg-green-500"
                              style={{ width: `${interestWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Aportes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Intereses generados</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 
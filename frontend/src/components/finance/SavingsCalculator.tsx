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

export const SavingsCalculator = () => {
  const { fetchMonthlyFinancialSummary } = useFinance();

  const [monthlyData, setMonthlyData] = useState({
    income: 3000,
    expenses: 2000,
    savings: 600,
    savingsRate: 20
  });

  const [targetAmount, setTargetAmount] = useState(10000);
  const [savingsRate, setSavingsRate] = useState(20);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Calcular el ahorro mensual cuando cambia el ingreso o el porcentaje de ahorro
  useEffect(() => {
    const availableForSavings = monthlyData.income - monthlyData.expenses;
    const calculatedSavings = (monthlyData.income * savingsRate) / 100;
    
    // Asegurarse de que el ahorro calculado no exceda el disponible
    const finalSavings = Math.min(calculatedSavings, availableForSavings);
    
    setMonthlyData(prev => ({
      ...prev,
      savings: finalSavings,
      savingsRate: savingsRate
    }));
  }, [monthlyData.income, monthlyData.expenses, savingsRate]);

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

  // Cargar datos reales al montar el componente
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoadingMonthly(true);
      try {
        const summary = await fetchMonthlyFinancialSummary();
        if (summary) {
          setMonthlyData(summary);
          setSavingsRate(summary.savingsRate);
        }
      } catch (error) {
        console.error('Error loading monthly data:', error);
      } finally {
        setIsLoadingMonthly(false);
      }
    };

    loadRealData();
  }, [fetchMonthlyFinancialSummary]);

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
                      <p className="text-sm text-muted-foreground">
                        Total de gastos registrados este mes
                      </p>
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
                    <p>${(monthlyData.income - monthlyData.expenses).toFixed(2)} disponible mensualmente</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Tasa de ahorro actual</span>
                    </div>
                    <p>{monthlyData.savingsRate.toFixed(1)}% de tus ingresos</p>
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
                      {monthlyData.savingsRate >= 20 
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
                      Recuerda: un {savingsRate}% de tus ingresos es un buen objetivo de ahorro.
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
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Aporte mensual</Label>
                      <div className="flex space-x-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={monthlyData.savings}
                          onChange={(e) => setMonthlyData(prev => ({ ...prev, savings: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Tasa de interés anual</Label>
                      <span className="text-muted-foreground">{savingsRate}%</span>
                    </div>
                    <Slider
                      value={[savingsRate]}
                      onValueChange={([value]) => setSavingsRate(value)}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Plazo (años)</Label>
                      <span className="text-muted-foreground">{Math.floor(targetAmount / monthlyData.savings)} meses</span>
                    </div>
                    <Slider
                      value={[Math.floor(targetAmount / monthlyData.savings)]}
                      onValueChange={([value]) => setTargetAmount(value * monthlyData.savings)}
                      min={1}
                      max={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frecuencia de capitalización</Label>
                    <Select
                      value="monthly"
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="annually">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proyección de inversión</CardTitle>
                <CardDescription>En {Math.floor(targetAmount / monthlyData.savings)} meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {targetAmount.toLocaleString('en-US', {
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
                        {monthlyData.savings.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Intereses generados</p>
                      <p className="text-muted-foreground">
                        {((targetAmount - monthlyData.savings) / monthlyData.savings).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: Math.floor(targetAmount / monthlyData.savings) }, (_, index) => {
                      const isEvenYear = (index + 1) % 2 === 0;
                      if (!isEvenYear && index !== Math.floor(targetAmount / monthlyData.savings) - 1) return null;

                      const totalWidth = 100;
                      const contributionsWidth = (monthlyData.savings / targetAmount) * totalWidth;
                      const interestWidth = ((targetAmount - monthlyData.savings) / targetAmount) * totalWidth;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Mes {index + 1}</span>
                            <span>
                              {targetAmount.toLocaleString('en-US', {
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
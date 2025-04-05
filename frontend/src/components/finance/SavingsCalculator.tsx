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
import { SavingsPlan } from '@/lib/finance';
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
  // Estados para el plan de ahorro real
  const {
    savingsPlan,
    isLoadingSavingsPlan,
    saveSavingsPlan,
    fetchMonthlyFinancialSummary,
  } = useFinance();

  const [realPlan, setRealPlan] = useState<SavingsPlan>({
    target_amount: 0,
    savings_rate: 0,
    monthly_income: 0,
    monthly_expenses: 0,
  });

  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Estados para el plan simulado
  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(2000);
  const [savingsRate, setSavingsRate] = useState(20);
  const [targetAmount, setTargetAmount] = useState(10000);

  // Estados para el interés compuesto
  const [initialAmount, setInitialAmount] = useState(1000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [years, setYears] = useState(10);
  const [capitalizationFrequency, setCapitalizationFrequency] = useState('monthly');
  const [investmentResult, setInvestmentResult] = useState<InvestmentResult>({
    finalAmount: 0,
    totalContributions: 0,
    interestEarned: 0,
    yearlyProjections: [],
  });

  // Calcular resultados para el ahorro simulado
  const calculateSavingsResults = () => {
    const availableForSaving = monthlyIncome - monthlyExpenses;
    const recommendedMonthlySaving = Math.round((monthlyIncome * savingsRate) / 100);
    const actualMonthlySaving = Math.min(recommendedMonthlySaving, availableForSaving);
    const monthsToGoal = actualMonthlySaving > 0 ? Math.ceil(targetAmount / actualMonthlySaving) : 0;
    
    return {
      monthlySaving: actualMonthlySaving,
      availableForSaving,
      monthsToGoal,
    };
  };

  // Calcular resultados para la inversión
  useEffect(() => {
    const calculateCompoundInterest = () => {
      const monthlyRate = annualReturn / 12 / 100;
      let balance = initialAmount;
      let yearlyProjections = [];
      let totalContributions = initialAmount;

      for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
          balance += monthlyContribution;
          totalContributions += monthlyContribution;
          balance *= (1 + monthlyRate);
        }

        yearlyProjections.push({
          year,
          amount: balance,
          contributions: totalContributions,
          interest: balance - totalContributions,
        });
      }

      return {
        finalAmount: balance,
        totalContributions,
        interestEarned: balance - totalContributions,
        yearlyProjections,
      };
    };

    const result = calculateCompoundInterest();
    setInvestmentResult(result);
  }, [initialAmount, monthlyContribution, annualReturn, years]);

  // Cargar datos reales al montar el componente
  useEffect(() => {
    const loadRealData = async () => {
      setIsLoadingMonthly(true);
      try {
        const summary = await fetchMonthlyFinancialSummary();
        if (summary) {
          setRealPlan(prev => ({
            ...prev,
            monthly_income: summary.income,
            monthly_expenses: summary.expenses,
          }));
        }
      } catch (error) {
        console.error('Error loading monthly data:', error);
      } finally {
        setIsLoadingMonthly(false);
      }
    };

    loadRealData();
  }, [fetchMonthlyFinancialSummary]);

  // Cargar plan de ahorro existente
  useEffect(() => {
    if (savingsPlan) {
      setRealPlan(savingsPlan);
    }
  }, [savingsPlan]);

  // Función para guardar el plan real
  const handleSaveRealPlan = async () => {
    await saveSavingsPlan(realPlan);
  };

  const savingsResults = calculateSavingsResults();

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
          <Card>
            <CardHeader>
              <CardTitle>Plan de Ahorro Real</CardTitle>
              <CardDescription>
                Basado en tus ingresos y gastos reales registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSavingsPlan || isLoadingMonthly ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="real-monthly-income">Ingreso Mensual</Label>
                    <Input
                      id="real-monthly-income"
                      type="number"
                      value={realPlan.monthly_income}
                      onChange={(e) => setRealPlan(prev => ({ ...prev, monthly_income: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="real-monthly-expenses">Gastos Mensuales</Label>
                    <Input
                      id="real-monthly-expenses"
                      type="number"
                      value={realPlan.monthly_expenses}
                      onChange={(e) => setRealPlan(prev => ({ ...prev, monthly_expenses: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="real-savings-rate">Porcentaje de Ahorro (%)</Label>
                    <Input
                      id="real-savings-rate"
                      type="number"
                      value={realPlan.savings_rate}
                      onChange={(e) => setRealPlan(prev => ({ ...prev, savings_rate: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="real-target-amount">Monto Objetivo</Label>
                    <Input
                      id="real-target-amount"
                      type="number"
                      value={realPlan.target_amount}
                      onChange={(e) => setRealPlan(prev => ({ ...prev, target_amount: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>

                  <Button onClick={handleSaveRealPlan} className="mt-4">
                    Guardar Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                      <span className="text-muted-foreground">{monthlyIncome} US$</span>
                    </div>
                    <Slider
                      value={[monthlyIncome]}
                      onValueChange={([value]) => setMonthlyIncome(value)}
                      max={10000}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Gastos mensuales</Label>
                      <span className="text-muted-foreground">{monthlyExpenses} US$</span>
                    </div>
                    <Slider
                      value={[monthlyExpenses]}
                      onValueChange={([value]) => setMonthlyExpenses(value)}
                      max={monthlyIncome}
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
                      {savingsResults.monthlySaving} US$
                    </h3>
                    <p className="text-muted-foreground">Ahorro mensual recomendado</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Tiempo para alcanzar tu meta</span>
                    </div>
                    <p>
                      {Math.floor(savingsResults.monthsToGoal / 12)} años y{' '}
                      {savingsResults.monthsToGoal % 12} meses
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Capacidad de ahorro</span>
                    </div>
                    <p>{savingsResults.availableForSaving} US$ disponible mensualmente</p>
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
                          value={initialAmount}
                          onChange={(e) => setInitialAmount(Number(e.target.value))}
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
                      <span className="text-muted-foreground">{annualReturn}%</span>
                    </div>
                    <Slider
                      value={[annualReturn]}
                      onValueChange={([value]) => setAnnualReturn(value)}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Plazo (años)</Label>
                      <span className="text-muted-foreground">{years} años</span>
                    </div>
                    <Slider
                      value={[years]}
                      onValueChange={([value]) => setYears(value)}
                      min={1}
                      max={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frecuencia de capitalización</Label>
                    <Select
                      value={capitalizationFrequency}
                      onValueChange={setCapitalizationFrequency}
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
                <CardDescription>En {years} años</CardDescription>
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
                      const isEvenYear = (index + 1) % 2 === 0;
                      if (!isEvenYear && index !== years - 1) return null;

                      const totalWidth = 100;
                      const contributionsWidth = (projection.contributions / projection.amount) * totalWidth;
                      const interestWidth = (projection.interest / projection.amount) * totalWidth;

                      return (
                        <div key={projection.year} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Año {projection.year}</span>
                            <span>
                              {projection.amount.toLocaleString('en-US', {
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
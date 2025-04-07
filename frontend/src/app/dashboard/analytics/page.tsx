import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductivityAnalytics } from "@/components/analytics/ProductivityAnalytics";
import { HabitsAnalytics } from "@/components/analytics/HabitsAnalytics";
import { FinanceAnalytics } from "@/components/analytics/FinanceAnalytics";
import { AllInsights } from "@/components/analytics/AllInsights";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Analítica Personal</h2>
      </div>
      <Tabs defaultValue="productividad" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
          <TabsTrigger value="habitos">Hábitos</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          <TabsTrigger value="insights">Todos los Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="productividad" className="space-y-4">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold">Análisis de Productividad</h3>
            <ProductivityAnalytics />
          </div>
        </TabsContent>
        <TabsContent value="habitos" className="space-y-4">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold">Análisis de Hábitos</h3>
            <HabitsAnalytics />
          </div>
        </TabsContent>
        <TabsContent value="finanzas" className="space-y-4">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold">Análisis Financiero</h3>
            <FinanceAnalytics />
          </div>
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <h3 className="text-xl font-semibold">Todos los Insights</h3>
            <AllInsights />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
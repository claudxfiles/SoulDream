import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductivityAnalytics } from "@/components/analytics/ProductivityAnalytics";
import { HabitsAnalytics } from "@/components/analytics/HabitsAnalytics";
import { FinanceAnalytics } from "@/components/analytics/FinanceAnalytics";
import { AllInsights } from "@/components/analytics/AllInsights";
import { Activity, Brain, DollarSign, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Dashboard de Analítica Personal</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Visualiza y analiza tus datos personales para tomar mejores decisiones
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Actualizado en tiempo real</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="productividad" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
          <TabsTrigger 
            value="productividad"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-md transition-all duration-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Productividad
          </TabsTrigger>
          <TabsTrigger 
            value="habitos"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-md transition-all duration-200"
          >
            <Brain className="h-4 w-4 mr-2" />
            Hábitos
          </TabsTrigger>
          <TabsTrigger 
            value="finanzas"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-md transition-all duration-200"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Finanzas
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-md transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Todos los Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productividad" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <ProductivityAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="habitos" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <HabitsAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="finanzas" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <FinanceAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="grid gap-6">
            <AllInsights />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
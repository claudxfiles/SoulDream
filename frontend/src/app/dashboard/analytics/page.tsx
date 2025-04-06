import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductivityAnalytics } from "@/components/analytics/ProductivityAnalytics";
import { HabitAnalytics } from "@/components/analytics/HabitAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Analítica Personal</h1>
      
      <Tabs defaultValue="productividad" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
          <TabsTrigger value="habitos">Hábitos</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          <TabsTrigger value="todos">Todos los Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="productividad" className="space-y-4">
          <ProductivityAnalytics />
        </TabsContent>

        <TabsContent value="habitos" className="space-y-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Análisis de Hábitos</h2>
            <HabitAnalytics />
          </div>
        </TabsContent>

        <TabsContent value="finanzas" className="space-y-4">
          {/* Contenido de Finanzas */}
          <div className="grid gap-4">
            <h2>Análisis Financiero</h2>
            {/* Componentes de análisis financiero */}
          </div>
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          {/* Todos los Insights */}
          <div className="grid gap-4">
            <h2>Todos los Insights</h2>
            {/* Vista general de todos los análisis */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
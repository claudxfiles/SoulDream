'use client';

import React, { useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { FinancialEducationContent } from '@/lib/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  BookOpen,
  Lightbulb,
  BookMarked,
  Search,
  GraduationCap,
  ChevronRight,
  Clock,
  Tag,
  BarChart3
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export function FinancialEducation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Datos de ejemplo para contenido educativo
  const educationalContent: FinancialEducationContent[] = [
    {
      id: '1',
      title: 'Fundamentos del ahorro',
      content: `
        <h3>Por qué ahorrar es importante</h3>
        <p>El ahorro es la base de la salud financiera y te permite construir un futuro más seguro.</p>
        <p>Beneficios principales del ahorro:</p>
        <ul>
          <li>Crear un fondo de emergencia para gastos inesperados</li>
          <li>Prepararte para gastos importantes a largo plazo</li>
          <li>Reducir la dependencia de deudas</li>
          <li>Aprovechar oportunidades de inversión</li>
        </ul>
        <h3>Estrategias efectivas de ahorro</h3>
        <p>Las estrategias más efectivas incluyen:</p>
        <ul>
          <li>La regla 50/30/20: 50% para necesidades, 30% para deseos, 20% para ahorro</li>
          <li>Automatizar tus ahorros con transferencias programadas</li>
          <li>Revisar y recortar gastos innecesarios</li>
          <li>Establecer metas específicas con plazos definidos</li>
        </ul>
      `,
      category: 'ahorro',
      level: 'beginner',
      reading_time: 5
    },
    {
      id: '2',
      title: 'Entendiendo el interés compuesto',
      content: `
        <h3>El poder del interés compuesto</h3>
        <p>El interés compuesto ha sido llamado la "octava maravilla del mundo" y es una de las fuerzas más poderosas en las finanzas personales.</p>
        <p>Cuando inviertes, no solo ganas interés sobre tu capital inicial, sino también sobre los intereses que has acumulado. Esto crea un efecto de "bola de nieve" donde tus ganancias crecen cada vez más rápido con el tiempo.</p>
        <h3>La regla del 72</h3>
        <p>Una forma sencilla de calcular cuánto tardará tu dinero en duplicarse es la "Regla del 72":</p>
        <p>Tiempo para duplicar tu dinero = 72 ÷ Tasa de interés anual</p>
        <p>Por ejemplo, con un interés anual del 8%, tu dinero se duplicará en aproximadamente 9 años (72 ÷ 8 = 9).</p>
        <h3>El valor del tiempo en la inversión</h3>
        <p>Comenzar a invertir temprano tiene un impacto dramático debido al interés compuesto:</p>
        <ul>
          <li>Alguien que invierte $200 mensuales desde los 25 hasta los 65 años (con un retorno anual del 7%) acumularía aproximadamente $525,000.</li>
          <li>Si comienza a los 35 años, acumularía solo $244,000.</li>
          <li>Esos 10 años de diferencia representan más del doble en el resultado final.</li>
        </ul>
      `,
      category: 'inversiones',
      level: 'beginner',
      reading_time: 7
    },
    {
      id: '3',
      title: 'Presupuesto personal efectivo',
      content: `
        <h3>Principios de un presupuesto eficaz</h3>
        <p>Un presupuesto no es una restricción, sino una herramienta de empoderamiento que te permite tomar decisiones conscientes sobre tu dinero.</p>
        <p>Los elementos de un presupuesto efectivo:</p>
        <ul>
          <li>Realista y flexible - Adaptado a tu situación real</li>
          <li>Completo - Incluye todos tus ingresos y gastos</li>
          <li>Enfocado en prioridades - Alineado con tus metas financieras</li>
          <li>Revisado regularmente - Ajustado según cambian tus circunstancias</li>
        </ul>
        <h3>Métodos de presupuesto populares</h3>
        <ul>
          <li><strong>Método de sobres</strong>: Asignar dinero en efectivo en sobres para diferentes categorías de gastos</li>
          <li><strong>Presupuesto de base cero</strong>: Asignar cada peso de ingreso a una categoría específica</li>
          <li><strong>50/30/20</strong>: 50% necesidades, 30% deseos, 20% ahorro y deudas</li>
          <li><strong>Sistema de cuentas múltiples</strong>: Distribuir el dinero en diferentes cuentas según su propósito</li>
        </ul>
        <h3>Herramientas de presupuesto</h3>
        <p>Existen numerosas aplicaciones y herramientas que pueden ayudarte a mantener un presupuesto:</p>
        <ul>
          <li>Aplicaciones como YNAB, Mint o Fintonic</li>
          <li>Hojas de cálculo personalizadas</li>
          <li>Métodos tradicionales como diarios de gastos</li>
        </ul>
      `,
      category: 'presupuesto',
      level: 'beginner',
      reading_time: 6
    },
    {
      id: '4',
      title: 'Inversiones para principiantes',
      content: `
        <h3>Conceptos básicos de inversión</h3>
        <p>Invertir significa poner tu dinero a trabajar con el objetivo de hacerlo crecer a lo largo del tiempo.</p>
        <p>Principios fundamentales que todo inversionista debe entender:</p>
        <ul>
          <li><strong>Riesgo vs. Rendimiento</strong>: Mayor rendimiento potencial generalmente implica mayor riesgo</li>
          <li><strong>Diversificación</strong>: No pongas todos tus huevos en la misma canasta</li>
          <li><strong>Horizonte temporal</strong>: Las inversiones a largo plazo pueden absorber mejor la volatilidad</li>
          <li><strong>Costos</strong>: Las comisiones pueden reducir significativamente tus retornos</li>
        </ul>
        <h3>Vehículos de inversión comunes</h3>
        <ul>
          <li><strong>Fondos indexados</strong>: Siguen un índice de mercado como el S&P 500</li>
          <li><strong>ETFs (Fondos cotizados)</strong>: Similar a los fondos indexados pero se compran/venden como acciones</li>
          <li><strong>Acciones individuales</strong>: Participación en empresas específicas</li>
          <li><strong>Bonos</strong>: Préstamos a gobiernos o empresas</li>
          <li><strong>Bienes raíces</strong>: Propiedades físicas o REITs (fideicomisos de inversión inmobiliaria)</li>
        </ul>
        <h3>Estrategias para principiantes</h3>
        <p>Si estás comenzando, considera:</p>
        <ul>
          <li>Empezar con fondos indexados de bajo costo</li>
          <li>Usar el promedio de costo en dólares (invertir cantidades fijas periódicamente)</li>
          <li>Automatizar tus inversiones</li>
          <li>Reinvertir dividendos y ganancias</li>
        </ul>
      `,
      category: 'inversiones',
      level: 'beginner',
      reading_time: 8
    },
    {
      id: '5',
      title: 'Gestión inteligente de deudas',
      content: `
        <h3>Tipos de deudas y sus implicaciones</h3>
        <p>No todas las deudas son iguales. Es importante distinguir entre:</p>
        <ul>
          <li><strong>Deuda "buena"</strong>: Financia activos que pueden aumentar de valor o generar ingresos (hipotecas, préstamos educativos, préstamos para negocios)</li>
          <li><strong>Deuda "mala"</strong>: Financia bienes de consumo o depreciables (tarjetas de crédito, préstamos personales para vacaciones)</li>
        </ul>
        <h3>Estrategias para eliminar deudas</h3>
        <p>Existen diferentes enfoques para pagar deudas eficientemente:</p>
        <ul>
          <li><strong>Método de avalancha</strong>: Pagar primero las deudas con las tasas de interés más altas (matemáticamente más eficiente)</li>
          <li><strong>Método de bola de nieve</strong>: Pagar primero las deudas más pequeñas (psicológicamente más motivador)</li>
          <li><strong>Consolidación de deudas</strong>: Combinar múltiples deudas en una con menor tasa de interés</li>
          <li><strong>Refinanciamiento</strong>: Obtener mejores términos para préstamos existentes</li>
        </ul>
        <h3>Manejo responsable del crédito</h3>
        <p>El crédito puede ser una herramienta útil cuando se utiliza correctamente:</p>
        <ul>
          <li>Pagar el saldo completo de las tarjetas mensualmente</li>
          <li>Mantener un ratio de utilización de crédito bajo (menos del 30%)</li>
          <li>Revisar informes crediticios regularmente</li>
          <li>No solicitar múltiples créditos en períodos cortos</li>
        </ul>
      `,
      category: 'deuda',
      level: 'intermediate',
      reading_time: 6
    },
    {
      id: '6',
      title: 'Planificación financiera a largo plazo',
      content: `
        <h3>Etapas de la planificación financiera</h3>
        <p>La planificación financiera abarca múltiples etapas de vida, cada una con diferentes prioridades:</p>
        <ul>
          <li><strong>20-30 años</strong>: Establecer hábitos financieros sólidos, comenzar a invertir, construir historial crediticio</li>
          <li><strong>30-40 años</strong>: Aumentar ahorros para metas importantes, equilibrar prioridades familiares</li>
          <li><strong>40-50 años</strong>: Maximizar ahorros para jubilación, finalizar grandes deudas</li>
          <li><strong>50-60 años</strong>: Refinar estrategia de jubilación, considerar cuidados de salud a largo plazo</li>
          <li><strong>60+ años</strong>: Estrategias de distribución de activos, planificación patrimonial</li>
        </ul>
        <h3>Construcción de patrimonio</h3>
        <p>Estrategias efectivas para construir patrimonio incluyen:</p>
        <ul>
          <li>Maximizar aportaciones a planes de jubilación</li>
          <li>Desarrollar múltiples fuentes de ingresos</li>
          <li>Invertir en activos que generen flujos de efectivo</li>
          <li>Adquirir activos con potencial de apreciación a largo plazo</li>
          <li>Proteger tu patrimonio con seguros adecuados</li>
        </ul>
        <h3>Planificación de la jubilación</h3>
        <p>Elementos clave para una jubilación financieramente segura:</p>
        <ul>
          <li>Comenzar temprano para aprovechar el interés compuesto</li>
          <li>Determinar tus necesidades de ingresos para la jubilación</li>
          <li>Diversificar entre diferentes tipos de inversiones y cuentas</li>
          <li>Considerar implicaciones fiscales de diferentes estrategias</li>
          <li>Revisar y ajustar el plan periódicamente</li>
        </ul>
      `,
      category: 'planificacion',
      level: 'advanced',
      reading_time: 10
    },
    {
      id: '7',
      title: 'Psicología del dinero',
      content: `
        <h3>Comportamientos financieros y sesgos cognitivos</h3>
        <p>Nuestras decisiones financieras están fuertemente influenciadas por factores psicológicos:</p>
        <ul>
          <li><strong>Aversión a la pérdida</strong>: Tendemos a sentir más dolor por las pérdidas que placer por las ganancias equivalentes</li>
          <li><strong>Sesgo del presente</strong>: Preferimos gratificación inmediata sobre beneficios futuros</li>
          <li><strong>Mentalidad de rebaño</strong>: Seguimos lo que hacen otros en lugar de tomar decisiones independientes</li>
          <li><strong>Exceso de confianza</strong>: Sobreestimamos nuestras habilidades para predecir mercados o eventos</li>
        </ul>
        <h3>Desarrollo de una mentalidad financiera saludable</h3>
        <p>Estrategias para mejorar tu relación con el dinero:</p>
        <ul>
          <li>Practicar la gratitud por lo que ya tienes</li>
          <li>Enfocarte en valores personales más que en comparaciones sociales</li>
          <li>Establecer límites y reglas financieras personales</li>
          <li>Celebrar pequeñas victorias en tu viaje financiero</li>
          <li>Practicar el consumo consciente y deliberado</li>
        </ul>
        <h3>Manejo del estrés financiero</h3>
        <p>El estrés financiero puede afectar severamente tu bienestar. Técnicas para manejarlo:</p>
        <ul>
          <li>Enfrentar problemas directamente en lugar de evitarlos</li>
          <li>Dividir grandes desafíos financieros en pasos manejables</li>
          <li>Buscar educación financiera para aumentar la confianza</li>
          <li>Desarrollar un plan de acción concreto</li>
          <li>Buscar apoyo social o profesional cuando sea necesario</li>
        </ul>
      `,
      category: 'psicologia',
      level: 'intermediate',
      reading_time: 7
    }
  ];

  // Filtrar por categoría y búsqueda
  const filteredContent = educationalContent.filter(item => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const renderLevelBadge = (level: string) => {
    let color = '';
    switch(level) {
      case 'beginner':
        color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        break;
      case 'intermediate':
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        break;
      case 'advanced':
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        break;
      default:
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {level === 'beginner' ? 'Principiante' : 
         level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Educación Financiera</h2>
          <p className="text-muted-foreground">
            Recursos para mejorar tus conocimientos financieros
          </p>
        </div>
        <div className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full md:w-[300px]"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="ahorro">Ahorro</TabsTrigger>
          <TabsTrigger value="inversiones">Inversiones</TabsTrigger>
          <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
          <TabsTrigger value="deuda">Deudas</TabsTrigger>
          <TabsTrigger value="planificacion">Planificación</TabsTrigger>
          <TabsTrigger value="psicologia">Psicología</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContent.map((article) => (
              <Card key={article.id} className="overflow-hidden flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>{article.reading_time} min de lectura</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Tag className="mr-1 h-3 w-3" />
                            <span className="capitalize">{article.category}</span>
                          </div>
                          <div>
                            {renderLevelBadge(article.level)}
                          </div>
                        </div>
                      </CardDescription>
                    </div>
                    {article.category === 'inversiones' && <BarChart3 className="h-5 w-5 text-primary" />}
                    {article.category === 'ahorro' && <Lightbulb className="h-5 w-5 text-amber-500" />}
                    {article.category === 'presupuesto' && <BookOpen className="h-5 w-5 text-green-500" />}
                    {article.category === 'deuda' && <BookMarked className="h-5 w-5 text-red-500" />}
                    {article.category === 'planificacion' && <GraduationCap className="h-5 w-5 text-blue-500" />}
                    {article.category === 'psicologia' && <Lightbulb className="h-5 w-5 text-purple-500" />}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="content">
                      <AccordionTrigger>Leer contenido</AccordionTrigger>
                      <AccordionContent>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none" 
                          dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 p-3">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xs text-muted-foreground">Revisado por expertos financieros</p>
                    <Button variant="ghost" size="sm" className="gap-1 text-primary">
                      Guardar <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {filteredContent.length === 0 && (
              <div className="col-span-2 p-8 text-center">
                <p className="text-muted-foreground">No se encontraron artículos que coincidan con tu búsqueda.</p>
                <Button variant="outline" onClick={() => {setSearchQuery(''); setActiveTab('all');}} className="mt-4">
                  Ver todos los artículos
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
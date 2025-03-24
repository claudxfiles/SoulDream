import { NextResponse } from 'next/server';

// Simulación de plan personalizado mientras se integra completamente
export async function POST(req: Request) {
  try {
    const { goal_type, preferences } = await req.json();
    
    console.log('Solicitud de plan personalizado recibida:', { goal_type, preferences });
    
    // Simulamos un tiempo de procesamiento realista
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generamos un plan de ejemplo basado en el tipo de meta
    const mockPlans: Record<string, any> = {
      fitness: {
        title: "Plan de Fitness Personalizado",
        summary: "Un plan personalizado diseñado para mejorar tu condición física general con un enfoque en fuerza y resistencia.",
        behavioral_insights: [
          "Tiendes a ser más consistente con tus entrenamientos por la mañana",
          "Los ejercicios de alta intensidad te motivan más que los de baja intensidad",
          "Necesitas variedad para mantener la motivación a largo plazo"
        ],
        steps: [
          { title: "Evaluación inicial", description: "Realizar una evaluación de condición física para establecer la línea base", timeframe: "Semana 1" },
          { title: "Rutina de fuerza", description: "3 sesiones semanales de entrenamiento de fuerza", timeframe: "Semanas 1-12" },
          { title: "Cardio", description: "2 sesiones semanales de entrenamiento cardiovascular", timeframe: "Semanas 1-12" },
          { title: "Nutrición", description: "Plan de alimentación balanceado con énfasis en proteínas", timeframe: "Continuo" },
          { title: "Evaluación de progreso", description: "Revisión mensual de métricas clave", timeframe: "Cada 4 semanas" }
        ],
        expected_outcomes: [
          "Aumento del 15% en fuerza en ejercicios principales",
          "Mejora de la resistencia cardiovascular",
          "Reducción de grasa corporal del 2-3%",
          "Establecimiento de hábitos sostenibles de ejercicio"
        ],
        reinforcement_mechanisms: [
          "Seguimiento visual de progreso con gráficos",
          "Sistema de recompensas por cumplir objetivos semanales",
          "Recordatorios personalizados antes de cada sesión programada",
          "Sugerencias adaptativas basadas en tu energía diaria"
        ],
        progress_tracking: [
          { metric: "Peso levantado", frequency: "Cada sesión" },
          { metric: "Tiempo de cardio", frequency: "Cada sesión" },
          { metric: "Medidas corporales", frequency: "Quincenal" },
          { metric: "Peso corporal", frequency: "Semanal" }
        ]
      },
      finanzas: {
        title: "Plan Financiero Personalizado",
        summary: "Un plan diseñado para optimizar tus finanzas personales con enfoque en ahorro e inversión.",
        behavioral_insights: [
          "Tus gastos impulsivos ocurren principalmente los fines de semana",
          "Tienes mayor disciplina para revisar finanzas a principios de mes",
          "Respondes mejor a metas financieras visuales"
        ],
        steps: [
          { title: "Análisis de gastos", description: "Revisar y categorizar todos los gastos del último trimestre", timeframe: "Semana 1" },
          { title: "Presupuesto optimizado", description: "Crear un presupuesto realista con regla 50/30/20", timeframe: "Semana 2" },
          { title: "Fondo de emergencia", description: "Establecer ahorro automático para 6 meses de gastos", timeframe: "Meses 1-12" },
          { title: "Revisión de deudas", description: "Optimizar y consolidar deudas pendientes", timeframe: "Mes 1" },
          { title: "Plan de inversión", description: "Investigar y configurar inversiones a largo plazo", timeframe: "Mes 2-3" }
        ],
        expected_outcomes: [
          "Reducción del 20% en gastos innecesarios",
          "Establecimiento de fondo de emergencia completo",
          "Inicio de plan de inversión a largo plazo",
          "Mayor tranquilidad financiera"
        ],
        reinforcement_mechanisms: [
          "Notificaciones automáticas de límites de presupuesto",
          "Visualizador de progreso hacia metas financieras",
          "Recompensas predefinidas al alcanzar hitos",
          "Recordatorios de revisión financiera mensual"
        ],
        progress_tracking: [
          { metric: "Gastos por categoría", frequency: "Semanal" },
          { metric: "Tasa de ahorro", frequency: "Mensual" },
          { metric: "Deuda total", frequency: "Mensual" },
          { metric: "Valor neto", frequency: "Trimestral" }
        ]
      },
      aprendizaje: {
        title: "Plan de Aprendizaje Personalizado",
        summary: "Un plan estructurado para dominar nuevas habilidades con enfoque en retención y aplicación práctica.",
        behavioral_insights: [
          "Aprendes mejor con un enfoque visual y práctico",
          "Mantienes mayor concentración en sesiones de 25-30 minutos",
          "Retienes mejor cuando enseñas lo aprendido a otros"
        ],
        steps: [
          { title: "Definición de objetivos", description: "Establecer metas claras y medibles de aprendizaje", timeframe: "Semana 1" },
          { title: "Recopilación de recursos", description: "Seleccionar los mejores recursos para tu estilo de aprendizaje", timeframe: "Semana 1-2" },
          { title: "Calendario de estudio", description: "Crear un horario realista de sesiones de estudio", timeframe: "Semana 2" },
          { title: "Práctica deliberada", description: "Implementar técnicas de práctica y repetición espaciada", timeframe: "Continuo" },
          { title: "Proyectos prácticos", description: "Aplicar lo aprendido en proyectos reales", timeframe: "Desde semana 3" }
        ],
        expected_outcomes: [
          "Dominio de los conceptos fundamentales del tema",
          "Capacidad para aplicar conocimientos en situaciones prácticas",
          "Desarrollo de hábitos de aprendizaje efectivos",
          "Creación de proyectos demonstrables"
        ],
        reinforcement_mechanisms: [
          "Sistema Pomodoro adaptado a tu ritmo óptimo",
          "Tests periódicos de conocimiento con espaciado óptimo",
          "Socialización del aprendizaje con comunidad",
          "Visualización de progreso por módulos"
        ],
        progress_tracking: [
          { metric: "Tiempo de estudio", frequency: "Diario" },
          { metric: "Comprensión de conceptos", frequency: "Semanal" },
          { metric: "Proyectos completados", frequency: "Mensual" },
          { metric: "Evaluación de habilidad", frequency: "Mensual" }
        ]
      },
      habito: {
        title: "Plan de Formación de Hábitos",
        summary: "Un sistema personalizado para desarrollar hábitos duraderos adaptado a tu personalidad y entorno.",
        behavioral_insights: [
          "Tu mayor obstáculo es la consistencia inicial (primeros 10 días)",
          "Respondes bien a la responsabilidad social",
          "Necesitas señales visuales en tu entorno para recordar"
        ],
        steps: [
          { title: "Diseño de hábito", description: "Definir el hábito con especificidad (qué, cuándo, dónde)", timeframe: "Día 1" },
          { title: "Reducción de fricción", description: "Eliminar obstáculos y facilitar la ejecución del hábito", timeframe: "Semana 1" },
          { title: "Sistema de señales", description: "Establecer recordatorios y señales contextuales", timeframe: "Semana 1" },
          { title: "Plan de recompensas", description: "Crear recompensas inmediatas que refuercen el hábito", timeframe: "Continuo" },
          { title: "Seguimiento de racha", description: "Mantener registro visual del progreso diario", timeframe: "Continuo" }
        ],
        expected_outcomes: [
          "Establecimiento completo del hábito en 66 días",
          "Reducción significativa del esfuerzo de voluntad necesario",
          "Integración del hábito en rutina diaria",
          "Desarrollo de identidad asociada al hábito"
        ],
        reinforcement_mechanisms: [
          "Sistema de responsabilidad con compañero o grupo",
          "Celebración visible de hitos (1, 7, 21, 66 días)",
          "Recordatorios contextuales basados en rutinas existentes",
          "Apilamiento de hábitos para mayor efectividad"
        ],
        progress_tracking: [
          { metric: "Ejecución diaria", frequency: "Diario" },
          { metric: "Facilidad percibida", frequency: "Semanal" },
          { metric: "Señales de formación de identidad", frequency: "Mensual" },
          { metric: "Desencadenantes de recaídas", frequency: "Continuo" }
        ]
      },
      productividad: {
        title: "Sistema de Productividad Personalizado",
        summary: "Un marco adaptado para optimizar tu flujo de trabajo y gestión de energía personal.",
        behavioral_insights: [
          "Tu pico de energía y concentración ocurre entre 9-11am",
          "Experimentas una caída de productividad después del almuerzo",
          "Te distraes fácilmente con notificaciones digitales"
        ],
        steps: [
          { title: "Auditoría de tiempo", description: "Rastrear cómo se utiliza realmente tu tiempo durante una semana", timeframe: "Semana 1" },
          { title: "Organización de entorno", description: "Optimizar espacios físicos y digitales para minimizar distracciones", timeframe: "Semana 2" },
          { title: "Bloqueo de tiempo", description: "Implementar calendario con bloques según niveles de energía", timeframe: "Semana 2+" },
          { title: "Sistema de tareas", description: "Establecer proceso de captura y priorización de tareas", timeframe: "Semana 3" },
          { title: "Rutinas de inicio/cierre", description: "Crear rituales para comenzar y finalizar el trabajo", timeframe: "Continuo" }
        ],
        expected_outcomes: [
          "Aumento del 30% en finalización de tareas importantes",
          "Reducción de tiempo desperdiciado en multitarea",
          "Mejor equilibrio entre trabajo y descanso",
          "Menor sensación de sobrecarga mental"
        ],
        reinforcement_mechanisms: [
          "Sesiones diarias de planificación (5-10 min)",
          "Revisiones semanales de sistema y ajustes",
          "Eliminación progresiva de distracciones digitales",
          "Celebración de victorias diarias y semanales"
        ],
        progress_tracking: [
          { metric: "Tareas importantes completadas", frequency: "Diario" },
          { metric: "Tiempo en estado de concentración", frequency: "Diario" },
          { metric: "Interrupciones y distracciones", frequency: "Semanal" },
          { metric: "Satisfacción con balance vida-trabajo", frequency: "Semanal" }
        ]
      }
    };
    
    // Seleccionar el plan adecuado o uno genérico si no existe
    const plan = mockPlans[goal_type] || {
      title: "Plan Personalizado",
      summary: "Un plan adaptado a tus necesidades específicas.",
      behavioral_insights: ["Este es un plan adaptado a tus preferencias y necesidades."],
      steps: [
        { title: "Paso 1", description: "Descripción del primer paso", timeframe: "Semana 1" },
        { title: "Paso 2", description: "Descripción del segundo paso", timeframe: "Semana 2" }
      ],
      expected_outcomes: ["Resultados positivos al seguir el plan"],
      reinforcement_mechanisms: ["Mecanismos para mantener el compromiso"],
      progress_tracking: [{ metric: "Progreso general", frequency: "Semanal" }]
    };
    
    // Adaptar el plan según las preferencias
    if (preferences) {
      // Aquí podríamos personalizar aún más el plan basado en preferencias
      console.log('Aplicando preferencias al plan:', preferences);
    }
    
    return NextResponse.json({ 
      personalized_plan: plan
    });
    
  } catch (error) {
    console.error('Error generando plan personalizado:', error);
    return NextResponse.json(
      { error: 'Error procesando tu solicitud de plan personalizado' },
      { status: 500 }
    );
  }
} 
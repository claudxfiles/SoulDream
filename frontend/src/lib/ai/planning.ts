/**
 * Sistema de generación de planes de acción para metas
 * Crea pasos accionables y timeframes basados en el área y mensaje del usuario
 */

export interface PlanTimeframe {
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

/**
 * Genera pasos accionables para una meta basada en el mensaje y área
 * @param message Mensaje del usuario
 * @param area Área de la meta
 * @returns Array de pasos accionables
 */
export async function generatePlanSteps(message: string, area: string): Promise<string[]> {
  // Planes predefinidos según el área
  const areaPlans: Record<string, string[]> = {
    desarrollo_personal: [
      "Definir objetivos específicos y medibles",
      "Investigar recursos y herramientas necesarias",
      "Crear un plan de acción detallado con fechas",
      "Establecer un sistema de seguimiento de progreso",
      "Identificar posibles obstáculos y soluciones",
      "Buscar mentores o comunidades de apoyo",
      "Programar revisiones periódicas del progreso"
    ],
    salud_bienestar: [
      "Realizar una evaluación inicial de salud",
      "Establecer metas específicas y realistas",
      "Diseñar un plan de alimentación balanceado",
      "Crear una rutina de ejercicio adaptada a tu nivel",
      "Implementar hábitos de descanso adecuados",
      "Programar chequeos regulares de progreso",
      "Ajustar el plan según resultados y sensaciones"
    ],
    educacion: [
      "Investigar programas y recursos educativos disponibles",
      "Establecer un calendario de estudio realista",
      "Identificar métodos de aprendizaje efectivos para ti",
      "Conseguir materiales y herramientas necesarias",
      "Conectar con otros estudiantes o comunidades",
      "Establecer hitos de evaluación periódicos",
      "Aplicar lo aprendido en proyectos prácticos"
    ],
    finanzas: [
      "Realizar un análisis completo de tu situación financiera actual",
      "Establecer un presupuesto detallado con categorías",
      "Identificar áreas de ahorro potencial",
      "Crear un plan de ahorro automático",
      "Investigar opciones de inversión adecuadas a tu perfil",
      "Establecer un fondo de emergencia",
      "Programar revisiones financieras mensuales"
    ],
    hobbies: [
      "Investigar sobre el hobby y recursos necesarios",
      "Adquirir herramientas o materiales básicos",
      "Encontrar tutoriales o cursos introductorios",
      "Establecer una práctica regular en tu agenda",
      "Conectar con comunidades de aficionados",
      "Participar en eventos o grupos relacionados",
      "Establecer pequeños proyectos para mejorar habilidades"
    ]
  };

  // Planes específicos para tipos de metas comunes
  const specificPlans: Record<string, string[]> = {
    "comprar casa": [
      "Evaluar tu situación financiera actual y capacidad de endeudamiento",
      "Establecer un presupuesto realista para la compra",
      "Crear un plan de ahorro para la entrada (20-30% del valor)",
      "Investigar opciones de hipoteca y pre-calificar con bancos",
      "Definir tus necesidades y preferencias de vivienda",
      "Contactar con agentes inmobiliarios de confianza",
      "Visitar propiedades y comparar opciones",
      "Realizar la oferta y negociación",
      "Completar el proceso legal y de financiación"
    ],
    "comprar coche": [
      "Determinar tu presupuesto total (incluyendo seguro y mantenimiento)",
      "Investigar modelos que se ajusten a tus necesidades",
      "Comparar opciones de financiación (préstamo vs. leasing)",
      "Ahorrar para el pago inicial (15-20% recomendado)",
      "Verificar costos de seguro para los modelos considerados",
      "Realizar pruebas de manejo de los modelos seleccionados",
      "Negociar el precio y condiciones de compra",
      "Completar el papeleo y financiación"
    ],
    "aprender idioma": [
      "Evaluar tu nivel actual con una prueba de nivel",
      "Establecer objetivos específicos (conversación, lectura, certificación)",
      "Seleccionar recursos de aprendizaje (apps, cursos, libros)",
      "Crear una rutina diaria de práctica (mínimo 30 minutos)",
      "Encontrar compañeros de intercambio de idiomas",
      "Consumir contenido en el idioma objetivo regularmente",
      "Programar evaluaciones periódicas de progreso",
      "Participar en situaciones reales de uso del idioma"
    ],
    "negocio jardinería": [
      "Realizar un estudio de mercado local para servicios de jardinería",
      "Definir los servicios específicos que ofrecerás",
      "Crear un plan de negocio detallado con proyecciones financieras",
      "Obtener las licencias y permisos necesarios",
      "Adquirir herramientas y equipos esenciales",
      "Establecer precios competitivos para tus servicios",
      "Crear una estrategia de marketing local (web, tarjetas, flyers)",
      "Desarrollar un sistema de gestión de clientes y citas",
      "Establecer alianzas con proveedores de plantas y materiales"
    ]
  };

  // Detectar si el mensaje coincide con algún plan específico
  const lowerMessage = message.toLowerCase();
  let steps: string[] = [];

  // Buscar coincidencias con planes específicos
  for (const [key, plan] of Object.entries(specificPlans)) {
    if (lowerMessage.includes(key)) {
      steps = plan;
      break;
    }
  }

  // Si no hay plan específico, usar el plan del área
  if (steps.length === 0 && areaPlans[area]) {
    steps = areaPlans[area];
  }

  // Si no hay plan para el área, usar plan genérico
  if (steps.length === 0) {
    steps = [
      "Definir objetivos específicos y medibles",
      "Investigar recursos necesarios",
      "Crear un plan de acción detallado",
      "Establecer un sistema de seguimiento",
      "Identificar posibles obstáculos",
      "Buscar apoyo o mentores",
      "Programar revisiones periódicas"
    ];
  }

  // En una implementación real, aquí se podría llamar a una API de IA
  // para generar pasos personalizados basados en el mensaje

  return steps;
}

/**
 * Genera un timeframe para la meta basado en el mensaje y tipo
 * @param message Mensaje del usuario
 * @param goalType Tipo de meta
 * @returns Timeframe con fechas de inicio y fin
 */
export function generateTimeframe(message: string, goalType: string): PlanTimeframe {
  const lowerMessage = message.toLowerCase();
  const today = new Date();
  let durationDays = 30; // Por defecto, 30 días
  
  // Buscar menciones de tiempo en el mensaje
  const timePatterns = [
    { regex: /(\d+)\s*días?/i, multiplier: 1 },
    { regex: /(\d+)\s*semanas?/i, multiplier: 7 },
    { regex: /(\d+)\s*meses?/i, multiplier: 30 },
    { regex: /(\d+)\s*años?/i, multiplier: 365 },
  ];
  
  // Extraer duración del mensaje si existe
  for (const pattern of timePatterns) {
    const match = lowerMessage.match(pattern.regex);
    if (match && match[1]) {
      const value = parseInt(match[1], 10);
      if (!isNaN(value) && value > 0) {
        durationDays = value * pattern.multiplier;
        break;
      }
    }
  }
  
  // Ajustar duración según el tipo de meta
  if (goalType === 'adquisicion') {
    // Las metas de adquisición suelen ser más largas
    if (durationDays < 30) durationDays = Math.max(durationDays, 90);
    
    // Casos específicos
    if (lowerMessage.includes('casa') || lowerMessage.includes('vivienda')) {
      durationDays = Math.max(durationDays, 365); // Mínimo 1 año para comprar casa
    } else if (lowerMessage.includes('coche') || lowerMessage.includes('auto') || lowerMessage.includes('moto')) {
      durationDays = Math.max(durationDays, 180); // Mínimo 6 meses para vehículos
    }
  } else if (goalType === 'aprendizaje') {
    // Las metas de aprendizaje varían según el tema
    if (lowerMessage.includes('idioma') || lowerMessage.includes('inglés') || lowerMessage.includes('francés')) {
      durationDays = Math.max(durationDays, 180); // Mínimo 6 meses para idiomas
    } else if (lowerMessage.includes('programación') || lowerMessage.includes('desarrollo web')) {
      durationDays = Math.max(durationDays, 120); // Mínimo 4 meses para programación
    }
  } else if (goalType === 'habito') {
    // Los hábitos necesitan al menos 66 días para formarse
    durationDays = Math.max(durationDays, 66);
  }
  
  // Calcular fecha de fin
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + durationDays);
  
  return {
    startDate: today,
    endDate,
    durationDays
  };
} 
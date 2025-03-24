/**
 * Sistema de clasificación de metas basado en el análisis de texto
 * Detecta el área, tipo y nivel de confianza de una meta potencial
 */

export interface GoalClassification {
  area: string;
  type: string;
  confidence: number;
  title?: string;
}

// Áreas vitales para clasificación
const goalAreas = {
  desarrollo_personal: [
    "mejorar", "crecer", "desarrollar", "habilidad", "competencia", 
    "personal", "autoestima", "confianza", "liderazgo", "comunicación",
    "organización", "productividad", "tiempo", "hábito", "rutina",
    "negocio", "emprender", "empresa", "startup", "proyecto"
  ],
  salud_bienestar: [
    "salud", "ejercicio", "fitness", "gimnasio", "correr", "nadar", 
    "bicicleta", "yoga", "meditación", "mindfulness", "dieta", 
    "nutrición", "alimentación", "peso", "dormir", "descanso",
    "estrés", "ansiedad", "mental", "bienestar"
  ],
  educacion: [
    "aprender", "estudiar", "curso", "carrera", "grado", "máster", 
    "doctorado", "certificación", "idioma", "inglés", "francés", 
    "alemán", "programación", "desarrollo", "habilidad", "conocimiento",
    "leer", "libro", "investigar", "universidad", "escuela"
  ],
  finanzas: [
    "dinero", "ahorro", "ahorrar", "inversión", "invertir", "deuda", 
    "préstamo", "hipoteca", "comprar", "casa", "apartamento", "coche", 
    "moto", "vehículo", "presupuesto", "gastos", "ingresos", "salario", 
    "jubilación", "retiro", "financiero", "economía", "banco"
  ],
  hobbies: [
    "hobby", "pasatiempo", "afición", "música", "instrumento", "guitarra", 
    "piano", "pintura", "dibujo", "fotografía", "jardinería", "cocina", 
    "viajar", "viaje", "excursión", "senderismo", "deporte", "equipo",
    "colección", "videojuegos", "juegos", "lectura", "escritura", "blog"
  ]
};

// Tipos de metas
const goalTypes = {
  adquisicion: [
    "comprar", "adquirir", "conseguir", "obtener", "lograr", "alcanzar",
    "casa", "coche", "moto", "vehículo", "propiedad", "terreno", "objeto"
  ],
  aprendizaje: [
    "aprender", "estudiar", "dominar", "conocer", "entender", "comprender",
    "habilidad", "idioma", "curso", "certificación", "grado", "carrera"
  ],
  habito: [
    "hábito", "rutina", "diario", "diaria", "semanal", "constante", 
    "regular", "consistente", "disciplina", "práctica", "ejercicio"
  ],
  otro: [
    "meta", "objetivo", "propósito", "plan", "intención", "deseo", 
    "aspiración", "sueño", "visión", "misión"
  ]
};

// Palabras clave que indican alta confianza
const highConfidenceKeywords = [
  "quiero", "necesito", "deseo", "me gustaría", "mi objetivo", 
  "mi meta", "planeo", "pienso", "voy a", "tengo que"
];

/**
 * Clasifica un mensaje para detectar si contiene una meta potencial
 * @param message Mensaje del usuario
 * @returns Clasificación de la meta (área, tipo y confianza)
 */
export function classifyAreaAndType(message: string): GoalClassification {
  const lowerMessage = message.toLowerCase();
  
  // Puntuaciones para cada área
  const areaScores: Record<string, number> = {};
  
  // Calcular puntuación para cada área
  for (const [area, keywords] of Object.entries(goalAreas)) {
    areaScores[area] = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        areaScores[area] += 1;
      }
    }
  }
  
  // Encontrar el área con mayor puntuación
  let maxAreaScore = 0;
  let maxArea = "desarrollo_personal"; // Valor por defecto
  
  for (const [area, score] of Object.entries(areaScores)) {
    if (score > maxAreaScore) {
      maxAreaScore = score;
      maxArea = area;
    }
  }
  
  // Puntuaciones para cada tipo
  const typeScores: Record<string, number> = {};
  
  // Calcular puntuación para cada tipo
  for (const [type, keywords] of Object.entries(goalTypes)) {
    typeScores[type] = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        typeScores[type] += 1;
      }
    }
  }
  
  // Encontrar el tipo con mayor puntuación
  let maxTypeScore = 0;
  let maxType = "habito"; // Valor por defecto
  
  for (const [type, score] of Object.entries(typeScores)) {
    if (score > maxTypeScore) {
      maxTypeScore = score;
      maxType = type;
    }
  }
  
  // Calcular nivel de confianza base (0-1)
  let confidence = Math.min(
    0.6 + (maxAreaScore / 10) + (maxTypeScore / 10),
    1.0
  );
  
  // Aumentar confianza si contiene palabras clave específicas
  for (const keyword of highConfidenceKeywords) {
    if (lowerMessage.includes(keyword)) {
      confidence += 0.1; // Aumentar confianza por cada palabra clave específica
    }
  }
  
  // Casos especiales para aumentar confianza
  if (lowerMessage.includes("negocio") && (lowerMessage.includes("jardines") || lowerMessage.includes("jardinería"))) {
    confidence = Math.min(confidence + 0.3, 1.0); // Aumentar significativamente para "negocio de jardines"
    maxArea = "desarrollo_personal"; // Asignar área específica
    maxType = "adquisicion"; // Asignar tipo específico
  }
  
  // Extraer un título potencial para la meta
  let title = extractGoalTitle(message, maxArea, maxType);
  
  // Limitar confianza a 1.0 máximo
  confidence = Math.min(confidence, 1.0);
  
  return {
    area: maxArea,
    type: maxType,
    confidence,
    title
  };
}

/**
 * Extrae un título potencial para la meta basado en el mensaje
 * @param message Mensaje del usuario
 * @param area Área detectada
 * @param type Tipo detectado
 * @returns Título sugerido para la meta
 */
function extractGoalTitle(message: string, area: string, type: string): string {
  // Patrones comunes para extraer títulos
  const patterns = [
    /quiero\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
    /mi\s+meta\s+es\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
    /me\s+gustaría\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
    /necesito\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
    /pienso\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
    /voy\s+a\s+(.*?)(?:\.|,|\s+y|\s+para|\s+porque|\s+que|\s+en|\s+con|$)/i,
  ];
  
  // Intentar extraer título usando patrones
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
      return match[1].trim();
    }
  }
  
  // Títulos por defecto según área y tipo
  const areaTitles = {
    desarrollo_personal: "Desarrollo personal",
    salud_bienestar: "Mejorar mi salud",
    educacion: "Aprendizaje",
    finanzas: "Meta financiera",
    hobbies: "Nuevo hobby"
  };
  
  const typeTitles = {
    adquisicion: "Adquirir",
    aprendizaje: "Aprender",
    habito: "Desarrollar hábito",
    otro: "Lograr objetivo"
  };
  
  return `${typeTitles[type as keyof typeof typeTitles]} - ${areaTitles[area as keyof typeof areaTitles]}`;
} 
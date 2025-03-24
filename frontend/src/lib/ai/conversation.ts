/**
 * Sistema de generación de respuestas conversacionales
 * Crea respuestas personalizadas basadas en el contexto de la conversación
 */

import { PlanTimeframe } from './planning';

export interface ConversationContext {
  message: string;
  area: string;
  type: string;
  confidence: number;
  planSteps: string[];
  messageHistory?: any[];
}

/**
 * Genera una respuesta conversacional basada en el contexto
 * @param context Contexto de la conversación
 * @returns Respuesta generada
 */
export async function generateConversationalResponse(context: ConversationContext): Promise<string> {
  const { message, area, type, confidence, planSteps, messageHistory } = context;
  const lowerMessage = message.toLowerCase();
  
  // Verificar si tenemos contexto de mensajes anteriores
  const hasContext = messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0;
  
  // Respuesta específica para negocio de jardinería
  if (lowerMessage.includes("jardines") || lowerMessage.includes("jardinería")) {
    let response = `He identificado que quieres iniciar un negocio de diseño de jardines. ¡Es una excelente idea! El diseño de jardines combina creatividad con conocimientos técnicos de plantas y paisajismo. `;
    
    if (lowerMessage.includes("empezando") || lowerMessage.includes("recién")) {
      response += `Como estás empezando, es importante construir una base sólida. `;
    }
    
    // Añadir el plan si hay pasos disponibles
    if (planSteps.length > 0) {
      response += `Te propongo el siguiente plan para desarrollar tu negocio:\n\n`;
      
      planSteps.forEach((step, index) => {
        response += `${index + 1}. ${step}\n`;
      });
    }
    
    response += `\n¿Te gustaría que te ayude a crear una meta estructurada con estos pasos para hacer seguimiento de tu progreso en el desarrollo de tu negocio de jardines?`;
    
    return response;
  }
  
  // Mapeo de nombres amigables para áreas y tipos
  const areaNames: Record<string, string> = {
    desarrollo_personal: "Desarrollo Personal",
    salud_bienestar: "Salud y Bienestar",
    educacion: "Educación",
    finanzas: "Finanzas",
    hobbies: "Hobbies y Pasatiempos"
  };

  const goalTypeNames: Record<string, string> = {
    adquisicion: "adquisición",
    aprendizaje: "aprendizaje",
    habito: "hábito",
    otro: "general"
  };

  // Generar respuesta según el nivel de confianza
  let response = "";
  
  // Si hay contexto de mensajes anteriores, personalizar la respuesta
  if (hasContext) {
    // Analizar el historial para dar continuidad a la conversación
    const userMessages = messageHistory.filter((msg: any) => msg.sender === 'user').map((msg: any) => msg.content);
    const lastUserMessages = userMessages.slice(-3); // Últimos 3 mensajes del usuario
    
    // Verificar si estamos en una conversación continua sobre el mismo tema
    const isContinuingTopic = lastUserMessages.length > 1 && 
      lastUserMessages.some(msg => 
        msg.toLowerCase().includes(area) || 
        Object.keys(areaNames).some(key => msg.toLowerCase().includes(key))
      );
    
    if (isContinuingTopic) {
      response = `Continuando con tu ${goalTypeNames[type]} en ${areaNames[area]}, `;
    }
  }
  
  if (confidence > 0.8) {
    // Alta confianza: Respuesta detallada con plan
    if (!response) {
      response = `He detectado que estás interesado en una meta de ${areaNames[area]} relacionada con ${goalTypeNames[type]}. `;
    }
    
    response += `Basado en lo que me comentas, puedo ayudarte a estructurar un plan para lograrlo.\n\n`;
    
    if (planSteps.length > 0) {
      response += `Te sugiero estos pasos para alcanzar tu objetivo:\n\n`;
      
      planSteps.forEach((step, index) => {
        response += `${index + 1}. ${step}\n`;
      });
      
      response += `\n¿Te gustaría que te ayude a crear una meta formal con estos pasos para hacer seguimiento de tu progreso?`;
    } else {
      response += `¿Te gustaría que te ayude a crear un plan detallado para alcanzar esta meta?`;
    }
  } else if (confidence > 0.6) {
    // Confianza media: Preguntar para confirmar
    response += `Parece que estás hablando sobre una meta relacionada con ${areaNames[area]}. `;
    
    if (type !== 'otro') {
      response += `¿Estás buscando ${type === 'adquisicion' ? 'adquirir algo' : type === 'aprendizaje' ? 'aprender algo nuevo' : 'desarrollar un hábito'}? `;
    }
    
    response += `Puedo ayudarte a establecer un plan estructurado si me das más detalles sobre lo que quieres lograr.`;
  } else {
    // Baja confianza: Respuesta genérica
    response += `Gracias por compartir eso conmigo. `;
    
    if (lowerMessage.includes("meta") || lowerMessage.includes("objetivo") || lowerMessage.includes("quiero") || lowerMessage.includes("gustaría")) {
      response += `Si estás pensando en establecer una meta, puedo ayudarte a estructurarla y crear un plan de acción. ¿Podrías darme más detalles sobre lo que te gustaría lograr?`;
    } else {
      response += `¿Hay alguna meta específica en la que estés pensando? Puedo ayudarte a establecer objetivos claros y crear planes de acción para alcanzarlos.`;
    }
  }
  
  return response;
} 
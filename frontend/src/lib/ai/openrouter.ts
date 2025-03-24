/**
 * Integración con OpenRouter API para chat y generación de texto
 * 
 * Esta librería maneja la comunicación con la API de OpenRouter,
 * permitiendo el uso de diferentes modelos de IA a través de un único endpoint.
 */

import { ProfileData } from '@/types/profile';
import { Goal } from '@/types/goal';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { FinanceTransaction } from '@/types/finance';
import { WorkoutData, WorkoutProgressData } from '@/types/workout';

// Tipos para las solicitudes y respuestas de OpenRouter
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequestOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  options?: OpenRouterRequestOptions;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  created: number;
  model: string;
  object: string;
}

// Tipos para el contexto del usuario
export interface UserContext {
  profile?: ProfileData;
  goals?: Goal[];
  tasks?: Task[];
  habits?: Habit[];
  finances?: FinanceTransaction[];
  workouts?: WorkoutData[];
  recentInteractions?: {
    query: string;
    response: string;
    timestamp: Date;
  }[];
}

/**
 * Envía una solicitud a OpenRouter
 */
export async function sendToOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'gpt-3.5-turbo',
  options: OpenRouterRequestOptions = {}
): Promise<string> {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  
  if (!openrouterApiKey) {
    console.error('API key de OpenRouter no encontrada');
    throw new Error('API key de OpenRouter no configurada');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://souldream.app',
        'X-Title': 'SoulDream Assistant'
      },
      body: JSON.stringify({
        model,
        messages,
        options: {
          max_tokens: 1000,
          temperature: 0.7,
          ...options
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error en OpenRouter: ${errorData.error || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error al llamar a OpenRouter:', error);
    throw error;
  }
}

/**
 * Genera el mensaje de sistema basado en el contexto del usuario y el módulo actual
 */
export function generateSystemPrompt(
  moduleContext: 'general' | 'goals' | 'tasks' | 'habits' | 'finances' | 'workout' | 'calendar',
  userContext?: UserContext
): string {
  // Prompt base para el asistente
  let systemPrompt = `Eres SoulDream AI, un asistente personal inteligente especializado en productividad, bienestar y desarrollo personal.
  
Tu objetivo es ayudar al usuario a organizar su vida y alcanzar sus metas proporcionando consejos personalizados, análisis y planes concretos.

Fecha actual: ${new Date().toLocaleDateString()}`;

  // Personalización según el módulo actual
  switch (moduleContext) {
    case 'goals':
      systemPrompt += `\n\nAhora estás en el módulo de Metas. Ayuda al usuario a:
- Definir metas SMART (Específicas, Medibles, Alcanzables, Relevantes y con Tiempo definido)
- Descomponer metas grandes en sub-metas y tareas accionables
- Establecer plazos realistas
- Identificar posibles obstáculos y soluciones
- Priorizar entre diferentes metas`;
      break;
    case 'tasks':
      systemPrompt += `\n\nAhora estás en el módulo de Tareas. Ayuda al usuario a:
- Organizar sus tareas pendientes
- Priorizar según urgencia e importancia
- Estimar tiempos para cada tarea
- Agrupar tareas relacionadas
- Sugerir técnicas de gestión del tiempo`;
      break;
    case 'habits':
      systemPrompt += `\n\nAhora estás en el módulo de Hábitos. Ayuda al usuario a:
- Desarrollar hábitos saludables y productivos
- Establecer sistemas para mantener consistencia
- Identificar disparadores (cues) y recompensas
- Superar obstáculos en la formación de hábitos
- Recomendar estrategias para evitar recaídas`;
      break;
    case 'finances':
      systemPrompt += `\n\nAhora estás en el módulo de Finanzas. Ayuda al usuario a:
- Analizar patrones de ingresos y gastos
- Establecer presupuestos realistas
- Crear planes de ahorro estratégicos
- Evaluar opciones financieras
- Priorizar metas financieras`;
      break;
    case 'workout':
      systemPrompt += `\n\nAhora estás en el módulo de Entrenamiento. Ayuda al usuario a:
- Diseñar rutinas de ejercicio personalizadas
- Adaptar entrenamientos según nivel y objetivos
- Mantener motivación y consistencia
- Establecer metas fitness alcanzables
- Integrar el ejercicio en su rutina diaria`;
      break;
    case 'calendar':
      systemPrompt += `\n\nAhora estás en el módulo de Calendario. Ayuda al usuario a:
- Optimizar su planificación temporal
- Equilibrar trabajo, descanso y actividades personales
- Identificar patrones de productividad
- Sugerir bloques de tiempo para diferentes actividades
- Evitar la sobrecarga del calendario`;
      break;
    default:
      systemPrompt += `\n\nComo asistente general, puedes ayudar en todas las áreas de vida. Intenta identificar la necesidad específica del usuario y proporciona la ayuda más relevante.`;
  }

  // Agregar contexto del usuario si está disponible
  if (userContext) {
    systemPrompt += `\n\nContexto del usuario:`;
    
    if (userContext.profile) {
      systemPrompt += `\n- Nombre: ${userContext.profile.full_name}`;
      systemPrompt += `\n- Nivel de suscripción: ${userContext.profile.subscription_tier}`;
    }
    
    if (userContext.goals && userContext.goals.length > 0) {
      systemPrompt += `\n- Metas activas: ${userContext.goals.length}`;
      systemPrompt += `\n  - Principales metas: ${userContext.goals.slice(0, 3).map(g => g.title).join(', ')}`;
    }
    
    if (userContext.tasks && userContext.tasks.length > 0) {
      const pendingTasks = userContext.tasks.filter(t => t.status === 'pending');
      systemPrompt += `\n- Tareas pendientes: ${pendingTasks.length}`;
    }
    
    if (userContext.habits && userContext.habits.length > 0) {
      systemPrompt += `\n- Está trabajando en ${userContext.habits.length} hábitos`;
    }
  }

  return systemPrompt;
}

/**
 * Convierte las conversaciones anteriores al formato de mensajes de OpenRouter
 */
export function formatConversationHistory(
  conversations: Array<{ content: string; sender: 'user' | 'ai'; timestamp: Date }>
): OpenRouterMessage[] {
  return conversations.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

/**
 * Detecta si la entrada del usuario contiene una posible meta
 */
export async function detectGoalIntent(input: string): Promise<{
  isGoal: boolean;
  confidence: number;
  area?: string;
  title?: string;
}> {
  try {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: `Analiza si el siguiente mensaje contiene una meta o intención de crear una meta. 
        Responde con un JSON con la siguiente estructura:
        {
          "isGoal": boolean,
          "confidence": number (0-1),
          "area": string (opcional, solo si isGoal es true),
          "title": string (opcional, solo si isGoal es true)
        }
        
        Áreas posibles: desarrollo_personal, salud_bienestar, educacion, finanzas, hobbies.`
      },
      {
        role: 'user',
        content: input
      }
    ];
    
    const response = await sendToOpenRouter(messages, 'openai/gpt-3.5-turbo');
    
    try {
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { isGoal: false, confidence: 0 };
    } catch (parseError) {
      console.error('Error al parsear respuesta de detección de meta:', parseError);
      return { isGoal: false, confidence: 0 };
    }
  } catch (error) {
    console.error('Error al detectar intención de meta:', error);
    return { isGoal: false, confidence: 0 };
  }
} 
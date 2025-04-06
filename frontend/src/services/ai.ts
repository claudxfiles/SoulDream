import { api } from './api';
import { ChatCompletionRequest, ChatCompletionResponse } from '@/types/ai';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatCompletionRequest {
  message: string;
  model?: string;
  messageHistory?: Array<{
    content: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }>;
}

export interface ChatCompletionResponse {
  response: string;
  has_goal?: boolean;
  metadata?: any;
}

export interface GoalMetadata {
  title: string;
  description: string;
  area: string;
  type: string;
  target_date?: string;
  priority: 'high' | 'medium' | 'low';
  steps?: string[];
}

export interface PersonalizedPlanRequest {
  user_data: any;
  goal_type: string;
  preferences?: {
    preferred_time_blocks?: string[];
    difficulty_preference?: 'easy' | 'moderate' | 'challenging' | 'balanced';
    priority_areas?: string[];
    learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'balanced';
  };
}

export interface PatternAnalysisRequest {
  user_data: any;
}

export interface LearningAdaptationRequest {
  user_data: any;
  interaction_history: Array<{
    recommendation_id: string;
    recommendation_type: string;
    recommendation_content: string;
    user_response: 'accepted' | 'rejected' | 'modified' | 'ignored';
    success_rating?: number;
    feedback?: string;
    timestamp: Date;
  }>;
  current_preferences?: {
    suggestionsFrequency: number;
    detailLevel: number;
    adaptivitySpeed: number;
    learningStyle: string;
    feedbackType: string;
    aiPersonality: string;
    topicPreferences: string[];
    enableAutonomousLearning: boolean;
    enableAdvancedPatternRecognition: boolean;
    enablePersonalizedSuggestions: boolean;
    enableContextualAwareness: boolean;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export const aiService = {
  /**
   * Envía un mensaje al chat de IA
   */
  async sendChatMessage(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await api.post('/api/v1/ai/openrouter-chat', request);
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje al chat de IA:', error);
      throw error;
    }
  },

  /**
   * Inicia una conexión de streaming para el chat
   */
  async createChatStream(message: string): Promise<EventSource> {
    // Obtener la sesión actual
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Necesitas iniciar sesión para usar el chat');
    }

    // Obtener la URL base del backend
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

    // Crear la URL con los parámetros necesarios
    const url = new URL('/api/v1/ai/openrouter-chat-stream', baseURL);
    url.searchParams.append('message', message);
    url.searchParams.append('authorization', `Bearer ${session.access_token}`);

    // Crear y retornar el EventSource
    const eventSource = new EventSource(url.toString());

    // Configurar manejadores de eventos básicos
    eventSource.onerror = (error) => {
      console.error('Error en la conexión EventSource:', error);
      eventSource.close();
    };

    return eventSource;
  },

  /**
   * Detecta si un mensaje contiene una meta
   */
  async detectGoal(message: string): Promise<{ has_goal: boolean; goal_metadata?: GoalMetadata }> {
    try {
      const response = await api.post('/api/v1/ai/detect-goal', { message });
      return response.data;
    } catch (error) {
      console.error('Error al detectar meta:', error);
      throw error;
    }
  },

  /**
   * Genera un plan detallado para una meta
   */
  async generateGoalPlan(goalMetadata: GoalMetadata): Promise<any> {
    try {
      const response = await api.post('/api/v1/ai/generate-goal-plan', { goal_metadata: goalMetadata });
      return response.data;
    } catch (error) {
      console.error('Error al generar plan para meta:', error);
      throw error;
    }
  },

  /**
   * Genera un plan personalizado basado en datos del usuario
   */
  async generatePersonalizedPlan(request: PersonalizedPlanRequest): Promise<any> {
    try {
      console.log('Enviando solicitud de plan personalizado:', request);
      const response = await api.post('/api/v1/ai/generate-personalized-plan', request);
      
      if (!response.data) {
        throw new Error('No se recibió una respuesta válida del servidor');
      }
      
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error al generar plan personalizado:', error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor. Verifique que el backend esté en ejecución.');
      }
      throw error;
    }
  },

  /**
   * Analiza patrones avanzados en los datos del usuario
   */
  async analyzePatterns(request: PatternAnalysisRequest): Promise<any> {
    try {
      const response = await api.post('/api/v1/ai/analyze-patterns', request);
      return response.data;
    } catch (error) {
      console.error('Error al analizar patrones:', error);
      throw error;
    }
  },

  /**
   * Genera adaptaciones basadas en aprendizaje continuo
   */
  async generateLearningAdaptation(request: LearningAdaptationRequest): Promise<any> {
    try {
      const response = await api.post('/api/v1/ai/learning-adaptation', request);
      return response.data;
    } catch (error) {
      console.error('Error al generar adaptación de aprendizaje:', error);
      throw error;
    }
  }
}; 
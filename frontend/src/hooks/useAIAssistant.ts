import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from './useAuth';
import { MuscleGroup, DifficultyLevel, AIWorkoutRecommendation } from '@/types/workout';

interface AIAssistantHook {
  generateResponse: (prompt: string) => Promise<string>;
  generateWorkoutRecommendations: (params: WorkoutRecommendationParams) => Promise<string>;
  isLoading: boolean;
}

interface WorkoutRecommendationParams {
  difficultyLevel: DifficultyLevel;
  muscleGroups: MuscleGroup[];
  duration: number;
  includeCardio: boolean;
}

// URL base del backend
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export function useAIAssistant(): AIAssistantHook {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const supabase = createClientComponentClient();

  const generateResponse = async (prompt: string): Promise<string> => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    setIsLoading(true);

    try {
      // Registramos la interacción en la tabla ai_interactions
      const { data: interaction, error: interactionError } = await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          query: prompt,
          context: 'general',
          model_used: 'qwen/qwq-32b:online',
          tokens_used: Math.round(prompt.length / 4), // Estimación aproximada
          response: ''
        })
        .select()
        .single();

      if (interactionError) {
        console.error('Error registrando interacción con IA:', interactionError);
      }

      // Obtener token de autenticación para la solicitud al backend
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Llamada al backend usando la URL completa
      const apiUrl = `${BACKEND_URL}/api/v1/ai/chat`;
      console.log('Enviando solicitud a:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response;
      
      // Actualizar la respuesta en la base de datos
      if (interaction?.id) {
        await supabase
          .from('ai_interactions')
          .update({
            response: aiResponse,
          })
          .eq('id', interaction.id);
      }

      return aiResponse;
    } catch (error) {
      console.error('Error al generar respuesta de IA:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateWorkoutRecommendations = async (params: WorkoutRecommendationParams): Promise<string> => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    setIsLoading(true);

    try {
      // Registramos la interacción en la tabla ai_interactions
      const { data: interaction, error: interactionError } = await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          query: JSON.stringify(params),
          context: 'workout',
          model_used: 'qwen/qwq-32b:online',
          tokens_used: 0, // Se actualizará después
          response: ''
        })
        .select()
        .single();

      if (interactionError) {
        console.error('Error registrando interacción con IA:', interactionError);
      }

      // Obtener token de autenticación para la solicitud al backend
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Asegurarse de que el usuario está realmente autenticado
      if (!session?.user?.id) {
        throw new Error('La sesión de usuario no está correctamente inicializada');
      }

      // Mostrar información de diagnóstico del token
      console.log('Info de autenticación:', {
        userId: user.id,
        email: user.email,
        tokenLength: token.length,
        tokenStart: token.substring(0, 15) + '...',
      });

      // Usar la URL completa del backend en lugar de la ruta relativa
      const apiUrl = `${BACKEND_URL}/api/v1/ai/workout-recommendations`;
      
      console.log('Enviando solicitud a:', apiUrl);
      
      // Asegurarse de que el token se envía con el formato correcto
      const authHeader = `Bearer ${token}`;
      console.log('Authorization header (primeros 20 caracteres):', authHeader.substring(0, 20) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          difficulty_level: capitalizeFirstLetter(params.difficultyLevel),
          muscle_groups: params.muscleGroups.map(group => mapMuscleGroupToBackend(group)),
          duration: params.duration,
          include_cardio: params.includeCardio,
          username: user.user_metadata?.full_name || user.email
        }),
        // Cambiamos a 'same-origin' ya que no necesitamos enviar cookies
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error(`Error en la solicitud (${response.status}):`, errorText);
        throw new Error(`Error en la solicitud: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.recommendations;
      
      // Actualizar la respuesta en la base de datos
      if (interaction?.id) {
        // Estimar tokens basados en la longitud de la respuesta
        const estimatedTokens = Math.round(aiResponse.length / 4);
        
        await supabase
          .from('ai_interactions')
          .update({
            response: aiResponse,
            tokens_used: estimatedTokens
          })
          .eq('id', interaction.id);
      }

      return aiResponse;
    } catch (error) {
      console.error('Error al generar recomendaciones de entrenamiento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateResponse,
    generateWorkoutRecommendations,
    isLoading,
  };
}

// Función auxiliar para capitalizar la primera letra
const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Mapeo de grupos musculares del frontend al backend
const mapMuscleGroupToBackend = (group: string): string => {
  const mapping: Record<string, string> = {
    'abs': 'Core',
    'biceps': 'Biceps',
    'calves': 'Calves',
    'chest': 'Chest',
    'forearms': 'Forearms',
    'glutes': 'Glutes',
    'hamstring': 'Legs',
    'obliques': 'Core',
    'quadriceps': 'Legs',
    'shoulder': 'Shoulders',
    'triceps': 'Triceps',
    'back': 'Back',
    'full_body': 'Back', // No existe equivalente directo, usamos uno común
    'cardio': 'Legs'     // No existe equivalente directo, usamos uno común
  };
  
  return mapping[group.toLowerCase()] || 'Chest'; // Valor predeterminado si no hay mapeo
}; 
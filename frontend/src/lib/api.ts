import { supabase } from './supabase';
import { AIInsight } from '@/types/analytics';

export async function fetchInsights(): Promise<AIInsight[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const response = await fetch('/api/insights', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los insights');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en fetchInsights:', error);
    throw error;
  }
} 
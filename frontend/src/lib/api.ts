import axios from 'axios';
import { AIInsight } from '@/types/analytics';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(async (config) => {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

export async function fetchInsights(): Promise<AIInsight[]> {
  try {
    const response = await api.get('/api/v1/insights');
    return response.data;
  } catch (error) {
    console.error('Error en fetchInsights:', error);
    throw error;
  }
} 
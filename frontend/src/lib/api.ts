import axios from 'axios';
import { AIInsight } from '@/types/analytics';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Función para asegurar uso de HTTPS en producción
const ensureHttps = (url: string): string => {
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Obtener la URL base con HTTPS en producción
const baseURL = ensureHttps(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(async (config) => {
  // Asegurar HTTPS para URLs absolutas en producción
  if (process.env.NODE_ENV === 'production' && config.url && config.url.startsWith('http://')) {
    config.url = config.url.replace('http://', 'https://');
  }
  
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
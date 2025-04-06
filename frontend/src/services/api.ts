import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Manejar error de autenticación
      if (typeof window !== 'undefined') {
        const supabase = createClientComponentClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api }; 
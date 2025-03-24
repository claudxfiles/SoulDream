import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { createClientComponent } from './supabase';

// Crear una instancia de axios con la configuración base
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token de autenticación en cada petición
api.interceptors.request.use(
  async (config) => {
    try {
      // Obtener el token de sesión de Supabase
      const supabase = createClientComponent();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      // Si hay un token, añadirlo a los headers
      if (session) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      
      return config;
    } catch (error) {
      console.error('Error obteniendo el token de sesión:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores comunes
    const message = error.response?.data?.detail || error.message || 'Ha ocurrido un error';
    
    // Mostrar toast de error
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      // Redirigir a la página de login si no está autenticado
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
); 
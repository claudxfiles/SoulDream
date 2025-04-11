import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Determinar la URL base para la API
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// En producción, forzar URL HTTPS
if (process.env.NODE_ENV === 'production') {
  API_URL = 'https://api.presentandflow.cl';
}

// Habilitar logs en desarrollo o deshabilitarlos en producción
const isDev = process.env.NODE_ENV === 'development';
const enableDetailedLogs = isDev; // Solo activar logs detallados en desarrollo

// Crear instancia de axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregamos un interceptor de depuración para registrar TODAS las peticiones HTTP
// Solo en navegadores modernos que tengan la API de Performance
if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType && process.env.NODE_ENV === 'production') {
  // Comprobamos cada segundo si hay nuevas peticiones de recursos
  const checkForXHR = () => {
    const resources = window.performance.getEntriesByType('resource');
    resources.forEach(resource => {
      const url = resource.name;
      if (url.includes('api.presentandflow.cl') && url.includes('http://')) {
        console.error('⚠️ DETECTADA PETICIÓN HTTP INSEGURA:', url);
      }
    });
  };
  
  setInterval(checkForXHR, 1000);
}

// NUEVO INTERCEPTOR CON MÁXIMA PRIORIDAD para forzar HTTPS en todas las solicitudes
apiClient.interceptors.request.use(
  function(config) {
    // Si estamos en producción
    if (process.env.NODE_ENV === 'production') {
      // Convertir URL completa si está presente y es HTTP
      if (config.url && config.url.includes('http://')) {
        config.url = config.url.replace(/http:\/\//g, 'https://');
      }
      
      // Convertir baseURL si es HTTP
      if (config.baseURL && config.baseURL.includes('http://')) {
        config.baseURL = config.baseURL.replace(/http:\/\//g, 'https://');
      }
      
      // SI URL ES RELATIVA, FORZAR URL ABSOLUTA CON HTTPS para este problema específico
      if (config.url && !config.url.includes('://') && config.url.includes('/api/v1/habits/')) {
        const habitId = config.url.split('/api/v1/habits/')[1].split('/')[0];
        config.url = `https://api.presentandflow.cl/api/v1/habits/${habitId}/`;
        // Eliminar baseURL para evitar duplicación
        config.baseURL = '';
      }
    }
    
    return config;
  },
  function(error) {
    return Promise.reject(error);
  },
  { runWhen: () => true } // Ejecutar en todas las solicitudes
);

// Interceptor para incluir el token de autenticación en cada solicitud
apiClient.interceptors.request.use(async (config) => {
  try {
    // Asegurarse que todas las URLs absolutas usen HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
      // Para URLs absolutas que comienzan con http://
      if (config.url && config.url.startsWith('http://')) {
        config.url = config.url.replace('http://', 'https://');
      }
      
      // Para URLs relativas, asegurarnos que baseURL es HTTPS
      if (config.baseURL && config.baseURL.startsWith('http://')) {
        config.baseURL = config.baseURL.replace('http://', 'https://');
      }
    }
    
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error obteniendo la sesión:', error);
  }
  
  return config;
}, (error) => {
  console.error('Error en la solicitud:', error);
  return Promise.reject(error);
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => {
    // Solo registrar respuestas en modo desarrollo y cuando se habilite para depuración
    if (isDev && enableDetailedLogs) {
      console.log(`Respuesta recibida de ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      // Log reducido para errores de respuesta
      console.error(`Error API: ${error.response.status} en ${originalRequest.url}`);
      
      // Logs detallados solo para desarrollo y cuando esté habilitado
      if (isDev && enableDetailedLogs) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data,
          requestData: originalRequest.data ? JSON.parse(originalRequest.data) : null
        });
      }
    } else if (error.request) {
      console.error('Error: No se recibió respuesta del servidor');
    } else {
      console.error('Error al configurar la solicitud:', error.message);
    }
    
    // Si el error es 401 (no autorizado) y no hemos intentado refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (isDev && enableDetailedLogs) {
          console.log('Intentando refrescar la sesión debido a error 401');
        }
        // Intentar refrescar la sesión
        const supabase = createClientComponentClient<Database>();
        const { data } = await supabase.auth.refreshSession();
        const session = data.session;
        
        if (session) {
          // Actualizar el token en la solicitud original y reintentarla
          if (isDev && enableDetailedLogs) {
            console.log('Sesión refrescada, reintentando solicitud');
          }
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return apiClient(originalRequest);
        } else {
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      } catch (refreshError) {
        console.error('Error refrescando la sesión');
        // Redirigir al login si no se pudo refrescar el token
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
); 
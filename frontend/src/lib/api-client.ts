import axios from 'axios';
import { createClientComponent } from './supabase';

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Habilitar logs en desarrollo o deshabilitarlos en producción
const isDev = process.env.NODE_ENV === 'development';
const enableDetailedLogs = false; // Cambiar a true solo para depuración

// Crear instancia de axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token de autenticación en cada solicitud
apiClient.interceptors.request.use(async (config) => {
  try {
    const supabase = createClientComponent();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      if (isDev && enableDetailedLogs) {
        console.log(`Petición autenticada: ${config.url}`);
      }
    } else if (isDev && enableDetailedLogs) {
      console.warn(`Petición sin autenticación: ${config.url}`);
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
        const supabase = createClientComponent();
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
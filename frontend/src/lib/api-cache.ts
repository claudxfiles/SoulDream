import { QueryClient } from '@tanstack/react-query';
import { getCachedValue, invalidateCache } from './utils';

/**
 * Configuración de tiempos de caché (en ms) para distintos tipos de datos
 */
export const CACHE_DURATIONS = {
  // Datos que casi nunca cambian
  STATIC: 24 * 60 * 60 * 1000, // 24 horas
  // Datos que cambian con poca frecuencia
  LONG: 60 * 60 * 1000, // 1 hora
  // Datos que cambian con frecuencia moderada
  MEDIUM: 10 * 60 * 1000, // 10 minutos
  // Datos que cambian frecuentemente
  SHORT: 60 * 1000, // 1 minuto
  // Sin caché
  NONE: 0
};

/**
 * Configuraciones de caché por tipo de recurso
 */
export const cacheConfigs = {
  // Configuración de usuario
  'user-settings': CACHE_DURATIONS.MEDIUM,
  // Datos de usuario y perfil
  'user-profile': CACHE_DURATIONS.MEDIUM,
  // Datos de tareas
  'tasks': CACHE_DURATIONS.SHORT,
  // Metas de usuario
  'goals': CACHE_DURATIONS.MEDIUM,
  // Datos financieros
  'finances': CACHE_DURATIONS.SHORT,
  // Hábitos
  'habits': CACHE_DURATIONS.SHORT,
  // Entrenamientos
  'workouts': CACHE_DURATIONS.MEDIUM, 
  // Datos estáticos de UI
  'ui-config': CACHE_DURATIONS.STATIC,
  // Eventos de calendario
  'calendar-events': CACHE_DURATIONS.SHORT,
  // Datos de pricing/planes
  'subscription-plans': CACHE_DURATIONS.LONG,
};

/**
 * Configura React Query con políticas de caché optimizadas
 */
export function configureQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configuración global
        refetchOnWindowFocus: false,
        retry: 1,
        // Estrategia de caché para la versión actual de React Query
        staleTime: CACHE_DURATIONS.SHORT, // Por defecto
        gcTime: CACHE_DURATIONS.MEDIUM, // Reemplaza cacheTime que está obsoleto
        // Optimización de rendimiento
        // Nuevos valores compatibles con la última versión
        select: (data: any) => data,
        // Comportamiento sensible
        refetchOnMount: true,
        // Manejo de errores
        throwOnError: false,
      },
    },
  });
}

/**
 * Genera una clave de caché para React Query basada en la ruta y los parámetros
 * @param baseKey Clave base (nombre del recurso/endpoint)
 * @param params Parámetros opcionales 
 */
export function createCacheKey(baseKey: string, params?: Record<string, any>): string[] {
  const key = [baseKey];
  
  if (params) {
    // Convertir los parámetros a un formato estable para la clave de caché
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .forEach(([paramKey, paramValue]) => {
        key.push(`${paramKey}:${JSON.stringify(paramValue)}`);
      });
  }
  
  return key;
}

/**
 * Cachea los resultados de una solicitud a la API
 * @param url URL de la API
 * @param fetchFn Función para realizar la solicitud 
 * @param cacheType Tipo de caché a utilizar (referencia a cacheConfigs)
 */
export async function cachedApiRequest<T>(
  url: string,
  fetchFn: () => Promise<T>, 
  cacheType: keyof typeof cacheConfigs = 'tasks',
): Promise<T> {
  const ttl = cacheConfigs[cacheType] || CACHE_DURATIONS.SHORT;
  
  // Si TTL es 0, no cachear
  if (ttl === 0) {
    return fetchFn();
  }
  
  return getCachedValue<T>(`api:${url}`, fetchFn, ttl);
}

/**
 * Invalida la caché para un tipo de recurso específico
 * @param cacheType Tipo de recurso a invalidar
 */
export function invalidateResourceCache(cacheType: keyof typeof cacheConfigs): void {
  invalidateCache(`api:${cacheType}`);
}

/**
 * Objeto con métodos para invalidar caches específicas
 */
export const cacheInvalidation = {
  tasks: () => invalidateResourceCache('tasks'),
  goals: () => invalidateResourceCache('goals'),
  finances: () => invalidateResourceCache('finances'),
  habits: () => invalidateResourceCache('habits'),
  workouts: () => invalidateResourceCache('workouts'),
  profile: () => invalidateResourceCache('user-profile'),
  settings: () => invalidateResourceCache('user-settings'),
  calendar: () => invalidateResourceCache('calendar-events'),
}; 
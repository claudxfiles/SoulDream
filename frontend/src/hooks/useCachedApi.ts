import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cachedApiRequest, createCacheKey, CACHE_DURATIONS, cacheConfigs } from '@/lib/api-cache';
import { useDebounce } from './useOptimizedRender';

/**
 * Hook para realizar llamadas a la API con caché optimizado
 * 
 * @param endpoint URL de la API 
 * @param fetchFn Función para obtener los datos
 * @param cacheType Tipo de caché a utilizar
 * @param params Parámetros opcionales para la consulta
 * @param options Opciones adicionales para useQuery
 */
export function useCachedApi<T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
  cacheType: keyof typeof cacheConfigs = 'tasks',
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<T, Error, T, any>, 'queryKey' | 'queryFn'>
) {
  // Generar clave de caché estable
  const queryKey = createCacheKey(endpoint, params);
  
  // Configurar duraciones basadas en el tipo de caché
  const cacheDuration = cacheConfigs[cacheType] || CACHE_DURATIONS.SHORT;
  
  // Envolver la función de obtención con caché
  const fetchWithCache = () => cachedApiRequest<T>(endpoint, fetchFn, cacheType);
  
  return useQuery<T>({
    queryKey,
    queryFn: fetchWithCache,
    staleTime: cacheDuration,
    gcTime: cacheDuration * 2,
    ...options
  });
}

/**
 * Hook para realizar búsquedas con debounce y caché
 * Útil para búsquedas de usuario y filtros que cambian frecuentemente
 */
export function useSearchWithCache<T>(
  baseEndpoint: string,
  fetchFn: (query: string) => Promise<T>,
  query: string,
  debounceMs = 400,
  cacheType: keyof typeof cacheConfigs = 'tasks'
) {
  // Usar debounce para evitar múltiples peticiones durante la escritura
  const debouncedQuery = useDebounce(query, debounceMs);
  
  // Crear un endpoint que incluya la consulta
  const endpoint = `${baseEndpoint}?q=${debouncedQuery}`;
  
  // Usar el hook principal con la consulta debounced
  return useCachedApi<T>(
    endpoint,
    () => fetchFn(debouncedQuery),
    cacheType,
    { query: debouncedQuery },
    {
      // No ejecutar la consulta si está vacía
      enabled: debouncedQuery.trim().length > 0,
      // Menor tiempo de caché para resultados de búsqueda
      staleTime: CACHE_DURATIONS.SHORT / 2
    }
  );
} 
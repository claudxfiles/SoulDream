import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

/**
 * Hook para memoizar valores y prevenir re-renders innecesarios
 * Similar a useMemo pero con garantía de estabilidad
 * 
 * @param value Valor a memoizar
 * @param compare Función para comparar valores (por defecto, comparación superficial)
 */
export function useStableMemo<T>(
  value: T,
  compare: (prevValue: T, nextValue: T) => boolean = shallowEqual
): T {
  const ref = useRef<T>(value);
  
  // Solo actualizar la referencia si el valor ha cambiado
  if (!compare(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Hook para crear funciones de callback estables
 * Similar a useCallback pero con dependencias automáticas
 * 
 * @param callback Función a memoizar
 * @param inputs Dependencias adicionales
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  inputs: any[] = []
): T {
  // Usamos ref para guardar la función más reciente
  const callbackRef = useRef(callback);
  
  // Actualizamos la ref con la función más reciente
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  // Creamos un wrapper estable que siempre llama a la función más reciente
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    inputs
  );
}

/**
 * Hook para retrasar la actualización de un valor
 * Útil para evitar renderizaciones durante operaciones frecuentes
 * 
 * @param value Valor a observar
 * @param delay Tiempo de retardo en ms
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook que combina useEffect y useCallback para operaciones asíncronas
 * Evita condiciones de carrera en operaciones asíncronas
 * 
 * @param asyncCallback Función asíncrona a ejecutar
 * @param deps Dependencias del efecto
 */
export function useAsyncEffect(
  asyncCallback: () => Promise<void | (() => void)>,
  deps: any[] = []
): void {
  useEffect(() => {
    let isMounted = true;
    const cleanup = { current: undefined as (() => void) | undefined };
    
    const execute = async () => {
      try {
        const result = await asyncCallback();
        
        // Si el componente se desmontó durante la operación, no hacemos nada
        if (!isMounted) return;
        
        // Si la función devolvió una función de limpieza, la guardamos
        if (typeof result === 'function') {
          cleanup.current = result;
        }
      } catch (error) {
        // Solo mostrar error si el componente sigue montado
        if (isMounted) {
          console.error('Error en useAsyncEffect:', error);
        }
      }
    };
    
    execute();
    
    // Función de limpieza
    return () => {
      isMounted = false;
      if (cleanup.current) {
        cleanup.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook para detectar cambios en props y memoizar valores
 * Útil para evitar renderizaciones innecesarias en componentes hijos
 * 
 * @param props Props a observar
 * @returns Props memoizadas
 */
export function usePropsChanged<T extends Record<string, any>>(props: T): T {
  const propsRef = useRef<T>(props);
  const changed = !shallowEqual(propsRef.current, props);
  
  if (changed) {
    propsRef.current = props;
  }
  
  return useMemo(() => propsRef.current, [changed]);
}

/**
 * Comparador superficial para objetos
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || 
      typeof b !== 'object' || b === null) return false;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!(key in (b as object)) || (a as any)[key] !== (b as any)[key]) {
      return false;
    }
  }
  
  return true;
} 
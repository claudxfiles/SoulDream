import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Opciones de configuración para el componente dinámico
 */
interface DynamicComponentOptions {
  /** 
   * Tiempo de espera antes de que se muestre el loader (ms)
   * Esto evita parpadeos en conexiones rápidas 
   */
  delayMs?: number;
  /** Componente personalizado de carga */
  loadingComponent?: React.ReactNode;
  /** Si es true, se carga el componente de inmediato, sin esperar a que sea visible en el viewport */
  preload?: boolean;
}

/**
 * Componente de carga por defecto
 */
export const DefaultLoader = () => (
  <div className="w-full flex justify-center items-center py-12">
    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
  </div>
);

/**
 * Crea un componente de carga dinámica con Suspense
 * 
 * @param importFn Función de importación dinámica (ej: () => import('./MiComponente'))
 * @param options Opciones de configuración
 * @returns Componente React con carga diferida
 */
export function createDynamicComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicComponentOptions = {}
) {
  const {
    delayMs = 400,
    loadingComponent = <DefaultLoader />,
    preload = false,
  } = options;

  // Crear componente con carga diferida
  const LazyComponent = lazy(importFn);

  // Opcional: precargar el componente inmediatamente
  if (preload) {
    importFn();
  }

  // Retornar un componente que encapsula la lógica de carga
  return function DynamicComponent(props: React.ComponentProps<T>) {
    const [showLoader, setShowLoader] = React.useState(false);

    // Mostrar loader solo después de cierto tiempo
    // Esto evita parpadeos de carga en conexiones rápidas
    React.useEffect(() => {
      const timer = setTimeout(() => setShowLoader(true), delayMs);
      return () => clearTimeout(timer);
    }, []);

    return (
      <Suspense fallback={showLoader ? loadingComponent : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Wrapper de preload para componentes dinámicos
 * Útil para precarga anticipada (ej: en hover)
 */
export function preloadComponent(importFn: () => Promise<{ default: any }>): void {
  importFn();
} 
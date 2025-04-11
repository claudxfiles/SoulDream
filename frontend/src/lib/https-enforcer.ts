/**
 * Utilidad para forzar HTTPS en todas las URLs
 */

/**
 * Convierte una URL HTTP a HTTPS
 */
export function forceHttps(url: string): string {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (url.startsWith('http://')) {
      console.log('Convirtiendo URL a HTTPS:', url);
      return url.replace(/^http:\/\//i, 'https://');
    }
  }
  return url;
}

/**
 * Hook de interceptación para solicitudes fetch
 * Esto envuelve el fetch global para forzar HTTPS en todas las solicitudes
 */
export function setupFetchInterceptor(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      if (typeof input === 'string' && input.startsWith('http://')) {
        console.log('Interceptor fetch - Convirtiendo a HTTPS:', input);
        input = input.replace(/^http:\/\//i, 'https://');
      }
      
      return originalFetch.call(this, input, init);
    };
    
    console.log('Interceptor global de fetch instalado para forzar HTTPS');
  }
}

/**
 * Monkeypatch XMLHttpRequest para forzar HTTPS
 */
export function patchXMLHttpRequest(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const originalOpen = XMLHttpRequest.prototype.open;
    
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async: boolean = true, 
      username?: string | null, 
      password?: string | null
    ): void {
      let updatedUrl = url;
      if (typeof url === 'string' && url.startsWith('http://')) {
        console.log('Interceptor XHR - Convirtiendo a HTTPS:', url);
        updatedUrl = url.replace(/^http:\/\//i, 'https://');
      }
      
      return originalOpen.call(this, method, updatedUrl, async, username, password);
    };
    
    console.log('Interceptor global de XMLHttpRequest instalado para forzar HTTPS');
  }
} 
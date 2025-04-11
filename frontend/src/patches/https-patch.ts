/**
 * Patch para forzar HTTPS en todas las solicitudes
 * Este patch intercepta solicitudes XMLHttpRequest y fetch para asegurar
 * que todas las URLs que comiencen con http:// se conviertan a https://
 * Solo se aplica en entorno de producción
 */

// Solo ejecutar si estamos en navegador y en producción
if (typeof window !== 'undefined') {
  const isProd = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';

  if (isProd) {
    console.log('🔒 Activando forzado de HTTPS para todas las solicitudes...');

    // 1. Interceptar XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string | URL, 
      async: boolean = true, 
      username?: string | null, 
      password?: string | null
    ): void {
      let secureUrl = url;
      
      if (typeof url === 'string' && url.includes('http://')) {
        secureUrl = url.replace(/http:\/\//g, 'https://');
        console.log(`🔄 XHR: Convertida ${url} -> ${secureUrl}`);
      }
      
      originalOpen.call(this, method, secureUrl, async, username, password);
    };

    // 2. Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      if (typeof input === 'string' && input.includes('http://')) {
        const secureInput = input.replace(/http:\/\//g, 'https://');
        console.log(`🔄 fetch: Convertida ${input} -> ${secureInput}`);
        return originalFetch.call(this, secureInput, init);
      }
      
      return originalFetch.call(this, input, init);
    };

    // 3. Monitorear las peticiones fallidas por contenido mixto
    window.addEventListener('error', function(e) {
      if (e.message && (
          e.message.includes('Mixed Content') || 
          e.message.includes('insecure')
        )) {
        console.error('⚠️ ERROR DE CONTENIDO MIXTO DETECTADO:', e.message);
        console.trace('Traza del error de contenido mixto');
      }
    }, true);

    console.log('✅ Interceptores HTTPS activados correctamente');
  }
} 
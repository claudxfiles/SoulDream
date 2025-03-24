/**
 * Patch para reemplazar importaciones de node:events
 * Este archivo debe importarse antes de cualquier librería de Google
 */

// Redirige node:events a events
// Esto se aplica antes de que cualquier otro módulo intente importar node:events
if (typeof window !== 'undefined') {
  // Solo aplicar en el lado del cliente
  const moduleCache = require.cache || {};
  
  // Establecer alias para node:events
  Object.defineProperty(moduleCache, 'node:events', {
    get() {
      return require('events');
    }
  });
}

export {}; 
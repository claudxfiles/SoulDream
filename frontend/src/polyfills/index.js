// Este archivo se carga antes de cualquier módulo de la aplicación
// para asegurar que todos los polyfills estén disponibles

// Cargar polyfill específico para process.stdout.isTTY
require('./process-patch');

// Cargar polyfills de Node.js core
require('./node-core-modules');

// Importar la función safeRequire pero sin modificar el require global
const safeRequire = require('./patch-require');
console.log('SafeRequire disponible para módulos node: URLs');

// Registrar polyfills específicos usando imports explícitos
// en lugar de intentar parchar el require global
global.nodeEvents = require('./node-events');
global.http2 = require('./http2');
global.nodeProcess = require('./node-process');

// Proporcionar un helper para importaciones node: sin modificar el require global
if (typeof window !== 'undefined') {
  // En lugar de sobrescribir window.require, añadimos un helper
  window.nodeModules = {
    // Mapa de módulos comunes que pueden ser necesarios
    events: require('./node-events'),
    process: require('./node-process'),
    stream: require('stream-browserify'),
    buffer: require('buffer'),
    util: require('util'),
    path: require('path-browserify'),
    http2: require('./http2')
  };
}

console.log('Node.js polyfills cargados correctamente'); 
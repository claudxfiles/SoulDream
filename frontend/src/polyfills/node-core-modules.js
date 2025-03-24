// Polyfill para los módulos core de Node.js más utilizados
// Este archivo se carga antes que cualquier otra dependencia

// Eventos
if (typeof global.process === 'undefined') {
  global.process = require('process/browser');
}

// Eventos
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Exportar módulos comunes
module.exports = {
  events: require('events'),
  stream: require('stream-browserify'),
  buffer: require('buffer'),
  util: require('util'),
  path: require('path-browserify'),
  process: require('process/browser'),
}; 
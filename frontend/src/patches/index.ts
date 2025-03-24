/**
 * Archivo de parches para compatibilidad con módulos de Node.js
 * Este archivo debe importarse al inicio de la aplicación para asegurar que los parches
 * se apliquen antes de que otros módulos intenten importar los módulos nativos de Node.js.
 */

// Este archivo centraliza todos los parches de Node.js
// Importa este archivo al inicio de tu aplicación para cargar todos los polyfills

import './node-events-patch';
import './http2-patch';

// Aquí puedes agregar más importaciones de parches si son necesarios en el futuro

console.log('Node.js polyfills cargados correctamente');

// Exporta un objeto vacío para permitir la importación como módulo
export {}; 
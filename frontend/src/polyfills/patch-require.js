// Enfoque más seguro para manejar imports de node: en el navegador
// en lugar de intentar parchear require globalmente, lo que causa conflictos con webpack

// Mapeo de módulos
const moduleMap = {
  'node:events': 'events',
  'node:process': 'process/browser',
  'node:stream': 'stream-browserify',
  'node:buffer': 'buffer',
  'node:util': 'util',
  'node:path': 'path-browserify',
  'http2': './http2'
};

// En lugar de sobrescribir require global, exportamos una función
// que puede ser usada explícitamente cuando sea necesario
function safeRequire(path) {
  if (typeof path === 'string' && moduleMap[path]) {
    return require(moduleMap[path]);
  }
  
  // Para cualquier otro módulo, usar el require normal
  return require(path);
}

// Exportamos la función sin modificar el require global
module.exports = safeRequire; 
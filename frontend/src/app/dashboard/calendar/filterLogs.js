/**
 * Script para filtrar logs no deseados
 * 
 * Para usar:
 * 1. Abre DevTools en Chrome
 * 2. Ve a la pestaña Console
 * 3. Copia y pega este código en la consola
 * 4. Presiona Enter
 * 
 * Esto eliminará los mensajes molestos sin afectar al código.
 */

// Guardar las funciones originales de console
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;

// Mensajes a filtrar (caso insensible)
const filtersInclude = [
  'credenciales de google calendar',
  'estado de conexión con google calendar',
  'token google disponible',
  'no se encontraron eventos para el rango',
  'critical dependency'
];

// Reemplazar console.log
console.log = function(...args) {
  // Convertir los argumentos a string
  const logString = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
  
  // Verificar si debemos filtrar este mensaje
  const shouldFilter = filtersInclude.some(filter => 
    logString.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Si no está en la lista de filtros, mostrar el log
  if (!shouldFilter) {
    originalConsoleLog.apply(console, args);
  }
};

// Reemplazar console.debug (generalmente invisible a menos que se habilite en DevTools)
console.debug = function(...args) {
  // Los debug los filtramos completamente a menos que esté habilitado el nivel debug en DevTools
  // Por defecto, console.debug no muestra nada
  originalConsoleDebug.apply(console, args);
};

console.log('🔍 Filtro de logs aplicado correctamente'); 
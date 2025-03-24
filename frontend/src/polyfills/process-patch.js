// Polyfill para process.stdout.isTTY
// Este archivo proporciona un reemplazo para la verificación de TTY en el navegador

if (typeof window !== 'undefined') {
  // Si estamos en el navegador, asegurarnos de que process exista
  if (!globalThis.process) {
    globalThis.process = {};
  }

  // Crear un objeto stdout falso con isTTY = false
  if (!globalThis.process.stdout) {
    globalThis.process.stdout = { 
      isTTY: false,
      write: () => {} // Función vacía
    };
  } else if (globalThis.process.stdout.isTTY === undefined) {
    // Si stdout existe pero isTTY no está definido, establecerlo como false
    globalThis.process.stdout.isTTY = false;
  }

  // También parchar stderr por si acaso
  if (!globalThis.process.stderr) {
    globalThis.process.stderr = { 
      isTTY: false,
      write: () => {} // Función vacía
    };
  } else if (globalThis.process.stderr.isTTY === undefined) {
    globalThis.process.stderr.isTTY = false;
  }
}

export {}; 
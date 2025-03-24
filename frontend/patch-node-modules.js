const fs = require('fs');
const path = require('path');

// Archivos a parchear
const files = [
  'node_modules/google-logging-utils/build/src/logging-utils.js',
  'node_modules/google-logging-utils/build/src/colours.js',
];

// Patrones de reemplazo
const replacements = [
  { from: 'require("node:events")', to: 'require("events")' },
  { from: 'require("node:process")', to: 'require("process/browser")' },
  { from: 'require("node:util")', to: 'require("util")' },
  { from: 'require("node:stream")', to: 'require("stream-browserify")' },
  { from: 'require("node:buffer")', to: 'require("buffer")' },
  { from: 'require("node:path")', to: 'require("path-browserify")' },
  { from: "require('node:events')", to: "require('events')" },
  { from: "require('node:process')", to: "require('process/browser')" },
  { from: "require('node:util')", to: "require('util')" },
  { from: "require('node:stream')", to: "require('stream-browserify')" },
  { from: "require('node:buffer')", to: "require('buffer')" },
  { from: "require('node:path')", to: "require('path-browserify')" },
];

// Parches específicos por archivo
const specificPatches = {
  'node_modules/google-logging-utils/build/src/colours.js': [
    {
      from: 'return typeof process.stdout !== "undefined" && process.stdout.isTTY;',
      to: 'return false; // Deshabilitado para evitar errores en cliente'
    },
    {
      from: 'if (process.stdout?.isTTY) {',
      to: 'if (false) { // Deshabilitado para evitar errores en cliente'
    }
  ]
};

// Función para parchear un archivo
function patchFile(filePath) {
  console.log(`Parcheando ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Aplicar todos los reemplazos generales
    for (const { from, to } of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        modified = true;
        console.log(`  Reemplazado: ${from} -> ${to}`);
      }
    }
    
    // Aplicar parches específicos para este archivo si existen
    const specificPatchesForFile = specificPatches[filePath];
    if (specificPatchesForFile) {
      for (const { from, to } of specificPatchesForFile) {
        if (content.includes(from)) {
          content = content.split(from).join(to);
          modified = true;
          console.log(`  Reemplazado específico: ${from} -> ${to}`);
        }
      }
    }
    
    if (modified) {
      // Hacer backup del archivo original
      const backupPath = `${filePath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, fs.readFileSync(filePath));
        console.log(`  Backup creado en ${backupPath}`);
      }
      
      // Escribir el archivo parcheado
      fs.writeFileSync(filePath, content);
      console.log(`  Archivo actualizado correctamente`);
    } else {
      console.log(`  No se encontraron patrones para reemplazar`);
    }
  } catch (error) {
    console.error(`  Error al parchear ${filePath}:`, error);
  }
}

// Parchear todos los archivos
console.log('Iniciando parche de archivos node_modules...');
files.forEach(file => patchFile(file));
console.log('Proceso de parche completado'); 
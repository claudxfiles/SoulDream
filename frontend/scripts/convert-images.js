const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorio que contiene las imágenes PNG
const inputDir = path.join(__dirname, '../public/image-workout');
// Mismo directorio para guardar las imágenes WebP
const outputDir = inputDir;

// Verificar si el directorio existe
if (!fs.existsSync(inputDir)) {
  console.error(`El directorio ${inputDir} no existe.`);
  process.exit(1);
}

// Opciones de conversión para WebP
const webpOptions = {
  quality: 80, // Calidad de 0 a 100
  lossless: false, // Usar compresión con pérdida
  effort: 6, // Esfuerzo de compresión (0-6)
};

// Función para convertir una imagen PNG a WebP
async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp(webpOptions)
      .toFile(outputPath);
    
    console.log(`Convertida: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    
    // Obtener tamaños de archivos para comparación
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(2);
    
    console.log(`  Tamaño original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  Tamaño WebP: ${(webpSize / 1024).toFixed(2)} KB`);
    console.log(`  Ahorro: ${savings}%`);
    
    return {
      file: path.basename(inputPath),
      originalSize,
      webpSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`Error al convertir ${inputPath}:`, error);
    return null;
  }
}

async function processDirectory() {
  // Leer todos los archivos en el directorio
  const files = fs.readdirSync(inputDir);
  
  console.log(`Encontradas ${files.length} imágenes para procesar...`);
  
  const results = [];
  let totalOriginalSize = 0;
  let totalWebpSize = 0;
  
  // Procesar cada archivo PNG
  for (const file of files) {
    if (path.extname(file).toLowerCase() === '.png') {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, `${path.basename(file, '.png')}.webp`);
      
      const result = await convertToWebP(inputPath, outputPath);
      
      if (result) {
        results.push(result);
        totalOriginalSize += result.originalSize;
        totalWebpSize += result.webpSize;
      }
    }
  }
  
  // Mostrar resultados
  console.log('\n===== RESUMEN DE CONVERSIÓN =====');
  console.log(`Total de imágenes convertidas: ${results.length}`);
  console.log(`Tamaño total original: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`Tamaño total WebP: ${(totalWebpSize / 1024).toFixed(2)} KB`);
  console.log(`Ahorro total: ${((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(2)}%`);
  
  // Informar sobre la actualización del código
  console.log('\nRecuerda actualizar las referencias a estas imágenes en tu código:');
  console.log('1. Cambia las extensiones .png a .webp en los componentes');
  console.log('2. Asegúrate de que Next.js esté configurado para servir archivos WebP correctamente');
}

// Ejecutar el proceso
processDirectory().catch(err => {
  console.error('Error durante la conversión:', err);
  process.exit(1);
}); 
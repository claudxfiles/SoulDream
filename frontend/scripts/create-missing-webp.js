const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorio que contiene las imágenes
const outputDir = path.join(__dirname, '../public/image-workout');

// Opciones de conversión para WebP
const webpOptions = {
  quality: 80,
  lossless: false,
  effort: 6,
};

// Imágenes que usaremos como base para crear las faltantes
const sourceImages = {
  'back': path.join(outputDir, 'Shoulder.webp'),    // Usar Shoulder como base para back
  'cardio': path.join(outputDir, 'abs.webp'),       // Usar abs como base para cardio
  'full_body': path.join(outputDir, 'Chest.webp'),  // Usar Chest como base para full_body
};

// Función para crear una imagen WebP a partir de otra
async function createWebpFromSource(sourcePath, targetName) {
  const outputPath = path.join(outputDir, `${targetName}.webp`);
  
  try {
    // Verificar que la imagen fuente existe
    if (!fs.existsSync(sourcePath)) {
      console.error(`La imagen fuente ${sourcePath} no existe`);
      return false;
    }
    
    await sharp(sourcePath)
      .webp(webpOptions)
      .toFile(outputPath);
    
    console.log(`Creada imagen: ${targetName}.webp a partir de ${path.basename(sourcePath)}`);
    return true;
  } catch (error) {
    console.error(`Error al crear ${targetName}.webp:`, error);
    return false;
  }
}

async function createMissingImages() {
  console.log('Creando imágenes WebP faltantes...');
  
  const results = [];
  
  for (const [targetName, sourcePath] of Object.entries(sourceImages)) {
    const success = await createWebpFromSource(sourcePath, targetName);
    results.push({ targetName, success });
  }
  
  console.log('\n===== RESUMEN =====');
  const successful = results.filter(r => r.success).length;
  console.log(`Imágenes creadas: ${successful}/${results.length}`);
  
  for (const result of results) {
    console.log(`${result.targetName}.webp: ${result.success ? '✅ Creada' : '❌ Error'}`);
  }
}

// Ejecutar el proceso
createMissingImages().catch(err => {
  console.error('Error durante la creación de imágenes:', err);
  process.exit(1);
}); 
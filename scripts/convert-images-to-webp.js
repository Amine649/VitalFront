const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './src/assets/images';
const outputDir = './src/assets/images-webp';

// Créer le dossier de sortie
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour convertir une image
async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 85 }) // 85% de qualité (bon compromis)
      .toFile(outputPath);
    
    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`   Taille: ${(inputSize / 1024).toFixed(1)} KB → ${(outputSize / 1024).toFixed(1)} KB (-${reduction}%)`);
    
    return { inputSize, outputSize };
  } catch (error) {
    console.error(`❌ Erreur: ${inputPath}`, error.message);
    return null;
  }
}

// Convertir toutes les images PNG et JPG
async function convertAllImages() {
  const files = fs.readdirSync(inputDir);
  
  console.log('🚀 Conversion des images en WebP...\n');
  
  let totalInputSize = 0;
  let totalOutputSize = 0;
  let convertedCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      
      const result = await convertToWebP(inputPath, outputPath);
      
      if (result) {
        totalInputSize += result.inputSize;
        totalOutputSize += result.outputSize;
        convertedCount++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA CONVERSION');
  console.log('='.repeat(60));
  console.log(`Images converties: ${convertedCount}`);
  console.log(`Taille totale avant: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Taille totale après: ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Réduction totale: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)}%`);
  console.log(`Économie: ${((totalInputSize - totalOutputSize) / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(60));
  console.log('\n✅ Conversion terminée!');
  console.log(`📁 Images WebP disponibles dans: ${outputDir}`);
  console.log('\n💡 Prochaine étape: Mettre à jour le HTML pour utiliser les images WebP');
}

convertAllImages();

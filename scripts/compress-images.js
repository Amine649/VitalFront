const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Image Compression Script
 * Compresses images using sharp library
 * Run: npm install --save-dev sharp
 */

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'optimized');

// Compression settings
const JPEG_QUALITY = 85;
const PNG_QUALITY = 90;
const WEBP_QUALITY = 85;

async function compressImages() {
  try {
    // Check if sharp is installed
    try {
      require.resolve('sharp');
    } catch (e) {
      console.log('📦 Installing sharp for image compression...');
      execSync('npm install --save-dev sharp', { stdio: 'inherit' });
    }

    const sharp = require('sharp');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('\n========================================');
    console.log('IMAGE COMPRESSION');
    console.log('========================================\n');

    const imageFiles = [];
    
    // Scan for images
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !filePath.includes('optimized')) {
          scanDir(filePath);
        } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
          imageFiles.push(filePath);
        }
      });
    }

    scanDir(ASSETS_DIR);

    console.log(`Found ${imageFiles.length} images to compress\n`);

    for (const imagePath of imageFiles) {
      const relativePath = path.relative(ASSETS_DIR, imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      const basename = path.basename(imagePath, ext);
      const dirname = path.dirname(relativePath);
      
      const outputPath = path.join(OUTPUT_DIR, dirname, `${basename}${ext}`);
      const webpPath = path.join(OUTPUT_DIR, dirname, `${basename}.webp`);
      
      // Create output subdirectory
      const outputSubdir = path.dirname(outputPath);
      if (!fs.existsSync(outputSubdir)) {
        fs.mkdirSync(outputSubdir, { recursive: true });
      }

      const originalSize = fs.statSync(imagePath).size / 1024;

      try {
        // Compress original format
        if (ext === '.jpg' || ext === '.jpeg') {
          await sharp(imagePath)
            .jpeg({ quality: JPEG_QUALITY, progressive: true })
            .toFile(outputPath);
        } else if (ext === '.png') {
          await sharp(imagePath)
            .png({ quality: PNG_QUALITY, compressionLevel: 9 })
            .toFile(outputPath);
        }

        // Create WebP version
        await sharp(imagePath)
          .webp({ quality: WEBP_QUALITY })
          .toFile(webpPath);

        const compressedSize = fs.statSync(outputPath).size / 1024;
        const webpSize = fs.statSync(webpPath).size / 1024;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

        console.log(`✅ ${relativePath}`);
        console.log(`   Original: ${originalSize.toFixed(2)} KB`);
        console.log(`   Compressed: ${compressedSize.toFixed(2)} KB (${savings}% smaller)`);
        console.log(`   WebP: ${webpSize.toFixed(2)} KB (${webpSavings}% smaller)`);
        console.log('');
      } catch (error) {
        console.error(`❌ Error compressing ${relativePath}:`, error.message);
      }
    }

    console.log('========================================');
    console.log('✅ Compression complete!');
    console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);
    console.log('========================================\n');
    console.log('💡 Next steps:');
    console.log('   1. Review the optimized images');
    console.log('   2. Replace original images with optimized versions');
    console.log('   3. Update image references to use WebP with fallbacks\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

compressImages();

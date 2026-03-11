const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Image Optimization and Duplicate Detection Script
 * This script scans for images, detects duplicates, and provides optimization recommendations
 */

const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

// Store image information
const imageMap = new Map();
const duplicates = [];

/**
 * Calculate MD5 hash of a file
 */
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Get file size in KB
 */
function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Recursively scan directory for images
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        const hash = getFileHash(filePath);
        const size = getFileSizeInKB(filePath);
        const relativePath = path.relative(ASSETS_DIR, filePath);

        const imageInfo = {
          path: relativePath,
          fullPath: filePath,
          hash,
          size: parseFloat(size),
          extension: ext
        };

        if (imageMap.has(hash)) {
          // Duplicate found
          duplicates.push({
            original: imageMap.get(hash),
            duplicate: imageInfo
          });
        } else {
          imageMap.set(hash, imageInfo);
        }
      }
    }
  });
}

/**
 * Generate report
 */
function generateReport() {
  console.log('\n========================================');
  console.log('IMAGE OPTIMIZATION REPORT');
  console.log('========================================\n');

  // List all images
  console.log('📊 IMAGES FOUND:');
  console.log('----------------------------------------');
  const images = Array.from(imageMap.values());
  images.forEach(img => {
    const sizeWarning = img.size > 500 ? ' ⚠️  (Large file!)' : '';
    console.log(`  ${img.path}`);
    console.log(`    Size: ${img.size} KB${sizeWarning}`);
    console.log(`    Hash: ${img.hash}`);
    console.log('');
  });

  // Report duplicates
  console.log('\n🔍 DUPLICATE DETECTION:');
  console.log('----------------------------------------');
  if (duplicates.length === 0) {
    console.log('  ✅ No duplicate images found!\n');
  } else {
    console.log(`  ⚠️  Found ${duplicates.length} duplicate(s):\n`);
    duplicates.forEach((dup, index) => {
      console.log(`  Duplicate #${index + 1}:`);
      console.log(`    Original: ${dup.original.path} (${dup.original.size} KB)`);
      console.log(`    Duplicate: ${dup.duplicate.path} (${dup.duplicate.size} KB)`);
      console.log(`    Hash: ${dup.original.hash}`);
      console.log('');
    });
  }

  // Optimization recommendations
  console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
  console.log('----------------------------------------');
  
  const largeImages = images.filter(img => img.size > 500);
  if (largeImages.length > 0) {
    console.log(`  ⚠️  ${largeImages.length} image(s) larger than 500 KB:\n`);
    largeImages.forEach(img => {
      console.log(`    ${img.path} - ${img.size} KB`);
      if (img.extension === '.jpg' || img.extension === '.jpeg') {
        console.log(`      → Consider converting to WebP format`);
        console.log(`      → Compress with quality 80-85%`);
      } else if (img.extension === '.png') {
        console.log(`      → Consider converting to WebP for photos`);
        console.log(`      → Use PNG only for images requiring transparency`);
      }
      console.log('');
    });
  } else {
    console.log('  ✅ All images are reasonably sized!\n');
  }

  // Summary
  console.log('\n📈 SUMMARY:');
  console.log('----------------------------------------');
  console.log(`  Total images: ${images.length}`);
  console.log(`  Total size: ${images.reduce((sum, img) => sum + img.size, 0).toFixed(2)} KB`);
  console.log(`  Duplicates: ${duplicates.length}`);
  console.log(`  Large files (>500KB): ${largeImages.length}`);
  
  const jpgCount = images.filter(img => ['.jpg', '.jpeg'].includes(img.extension)).length;
  const pngCount = images.filter(img => img.extension === '.png').length;
  const webpCount = images.filter(img => img.extension === '.webp').length;
  
  console.log(`\n  By format:`);
  console.log(`    JPG/JPEG: ${jpgCount}`);
  console.log(`    PNG: ${pngCount}`);
  console.log(`    WebP: ${webpCount}`);
  console.log('');
  
  console.log('========================================\n');
}

// Run the script
try {
  console.log('🔍 Scanning for images...\n');
  scanDirectory(ASSETS_DIR);
  generateReport();
  
  // Exit with error code if duplicates found
  if (duplicates.length > 0) {
    console.log('⚠️  Action required: Remove duplicate images to optimize your project.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

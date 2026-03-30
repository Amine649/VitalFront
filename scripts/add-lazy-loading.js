const fs = require('fs');
const path = require('path');

// Directories to process
const directories = [
  'src/app/components',
  'src/app',
  'src'
];

let filesProcessed = 0;
let imagesUpdated = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Match <img> tags that don't already have loading attribute
    // Handle both self-closing and non-self-closing tags
    const imgRegex = /<img\s+([^>]*?)(\s*\/?)>/gi;
    
    content = content.replace(imgRegex, (match, attributes, selfClosing) => {
      // Check if loading attribute already exists
      if (/loading\s*=\s*["']/.test(attributes)) {
        return match; // Already has loading attribute
      }
      
      modified = true;
      imagesUpdated++;
      
      // Add loading="lazy" and fix self-closing syntax
      const cleanAttributes = attributes.trim();
      const isSelfClosing = selfClosing.trim() === '/';
      
      if (isSelfClosing) {
        return `<img ${cleanAttributes} loading="lazy" />`;
      } else {
        return `<img ${cleanAttributes} loading="lazy">`;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesProcessed++;
      console.log(`✓ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (file.endsWith('.html')) {
        processFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('🚀 Adding loading="lazy" to all images...\n');

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    walkDirectory(fullPath);
  }
});

console.log(`\n✅ Complete!`);
console.log(`   Files modified: ${filesProcessed}`);
console.log(`   Images updated: ${imagesUpdated}`);

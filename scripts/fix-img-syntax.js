const fs = require('fs');
const path = require('path');

// Directories to process
const directories = [
  'src/app/components',
  'src/app',
  'src'
];

let filesProcessed = 0;
let fixesApplied = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix: " / loading=" to " loading="
    const regex1 = /\s+\/\s+loading=/g;
    if (regex1.test(content)) {
      content = content.replace(regex1, ' loading=');
      modified = true;
      fixesApplied++;
    }
    
    // Fix: " />" to " />" (ensure proper spacing)
    const regex2 = /\s+\/\s*>/g;
    if (regex2.test(content)) {
      content = content.replace(regex2, ' />');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesProcessed++;
      console.log(`✓ Fixed: ${filePath}`);
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

console.log('🔧 Fixing image tag syntax...\n');

directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    walkDirectory(fullPath);
  }
});

console.log(`\n✅ Complete!`);
console.log(`   Files fixed: ${filesProcessed}`);
console.log(`   Syntax issues resolved: ${fixesApplied}`);

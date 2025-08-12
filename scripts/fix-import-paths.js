#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to fix import paths in a file
function fixImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix relative imports that go outside src/
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const matches = [...content.matchAll(importRegex)];
  
  matches.forEach(match => {
    const importPath = match[1];
    
    // Skip node_modules imports
    if (importPath.startsWith('.') || importPath.startsWith('..')) {
      const currentDir = path.dirname(filePath);
      const resolvedPath = path.resolve(currentDir, importPath);
      const srcDir = path.resolve('frontend/src');
      
      // If the resolved path is outside src/, we need to fix it
      if (!resolvedPath.startsWith(srcDir)) {
        // Try to find the file in src/
        const fileName = path.basename(resolvedPath);
        const possiblePaths = [
          path.join(srcDir, fileName),
          path.join(srcDir, 'components', fileName),
          path.join(srcDir, 'pages', fileName),
          path.join(srcDir, 'lib', fileName),
          path.join(srcDir, 'contexts', fileName),
          path.join(srcDir, 'routes', fileName),
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            const relativePath = path.relative(currentDir, possiblePath).replace(/\\/g, '/');
            const newImport = importPath.replace(/^\.\.?\//, '');
            const fixedImport = `./${relativePath}`;
            
            content = content.replace(
              new RegExp(`from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
              `from '${fixedImport}'`
            );
            modified = true;
            break;
          }
        }
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
  
  return modified;
}

// Main execution
const srcDir = path.join('frontend', 'src');
if (!fs.existsSync(srcDir)) {
  console.error('❌ frontend/src directory not found');
  process.exit(1);
}

const files = findFiles(srcDir);

let fixedFiles = 0;
files.forEach(file => {
  if (fixImportPaths(file)) {
    fixedFiles++;
  }
});

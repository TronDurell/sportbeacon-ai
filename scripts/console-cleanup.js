#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan (exclude test files and node_modules)
const SCAN_DIRECTORIES = [
  'frontend/src',
  'lib',
  'functions/src',
  'backend',
  'agents'
];

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to exclude (test files, config files, etc.)
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /node_modules/,
  /\.config\./,
  /jest\.setup/,
  /cypress/
];

// Console statements to remove
const CONSOLE_PATTERNS = [
  /console\.log\s*\([^)]*\);?\s*/g,
  /console\.error\s*\([^)]*\);?\s*/g,
  /console\.warn\s*\([^)]*\);?\s*/g,
  /console\.info\s*\([^)]*\);?\s*/g,
  /console\.debug\s*\([^)]*\);?\s*/g
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalRemoved = 0;

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let removedCount = 0;

    // Remove console statements
    CONSOLE_PATTERNS.forEach(pattern => {
      const matches = modifiedContent.match(pattern);
      if (matches) {
        removedCount += matches.length;
        modifiedContent = modifiedContent.replace(pattern, '');
      }
    });

    if (removedCount > 0) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✓ Removed ${removedCount} console statements from ${filePath}`);
      modifiedFiles++;
      totalRemoved += removedCount;
    }

    totalFiles++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!shouldExcludeFile(fullPath)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      if (EXTENSIONS.includes(ext) && !shouldExcludeFile(fullPath)) {
        processFile(fullPath);
      }
    }
  }
}

console.log('🧹 Starting console.log cleanup...\n');

// Scan all directories
SCAN_DIRECTORIES.forEach(dir => {
  console.log(`Scanning ${dir}...`);
  scanDirectory(dir);
});

console.log('\n📊 Cleanup Summary:');
console.log(`   Files scanned: ${totalFiles}`);
console.log(`   Files modified: ${modifiedFiles}`);
console.log(`   Console statements removed: ${totalRemoved}`);

if (modifiedFiles > 0) {
  console.log('\n✅ Console cleanup completed successfully!');
} else {
  console.log('\n✨ No console statements found to remove.');
} 
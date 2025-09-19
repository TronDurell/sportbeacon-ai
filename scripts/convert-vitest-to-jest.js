#!/usr/bin/env node

/**
 * Vitest to Jest Conversion Script
 * Converts all Vitest imports and syntax to Jest equivalents
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to convert (excluding config files and smoke tests that should use Vitest)
const filesToConvert = [
  'frontend/src/analytics/events.test.js',
  'frontend/src/__tests__/integration/admin.test.js',
  'frontend/src/__tests__/SmartAlerts.test.js',
  'frontend/src/__tests__/Feed.test.js',
  'frontend/src/__tests__/LocationThread.test.js',
  'frontend/src/__tests__/integration/admin.test.ts',
  'frontend/src/__tests__/LocationThread.test.tsx',
  'frontend/src/__tests__/Feed.test.tsx',
  'frontend/src/__tests__/SmartAlerts.test.tsx',
  'packages/mcp-server/src/__tests__/tools/verifyStat.test.ts',
  'packages/mcp-server/src/__tests__/index.test.ts',
  'packages/mcp-server/src/__tests__/tools/getPlayerStats.test.ts',
  'packages/mcp-server/src/__tests__/auth.test.ts'
];

// Files to exclude from conversion (these should use Vitest)
const filesToExclude = [
  'frontend/test/setup.ts',
  'packages/memory-sdk/src/smoke.test.ts',
  'packages/mcp-server/src/smoke.test.ts',
  'functions/src/smoke.test.ts',
  'frontend/src/smoke.test.tsx',
  'frontend/src/smoke.test.js',
  'packages/mcp-server/src/__tests__/setup.ts'
];

function convertFile(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Convert imports
    if (content.includes("from 'vitest'") || content.includes('from "vitest"')) {
      content = content.replace(
        /import\s*{\s*([^}]+)\s*}\s*from\s*['"]vitest['"]/g,
        (match, imports) => {
          // Replace vi with jest in imports
          const jestImports = imports.replace(/\bvi\b/g, 'jest');
          return `import { ${jestImports} } from '@jest/globals'`;
        }
      );
      modified = true;
    }

    // Convert vi.* to jest.*
    if (content.includes('vi.')) {
      content = content.replace(/\bvi\./g, 'jest.');
      modified = true;
    }

    // Convert vi( to jest.fn(
    if (content.includes('vi(')) {
      content = content.replace(/\bvi\(/g, 'jest.fn(');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Converted: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔄 Converting Vitest files to Jest...\n');

  filesToConvert.forEach(convertFile);

  console.log('\n✅ Conversion complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run test:jest');
  console.log('2. Fix any remaining import issues');
  console.log('3. Update snapshots if needed: npm run test:jest -- -u');
}

main();

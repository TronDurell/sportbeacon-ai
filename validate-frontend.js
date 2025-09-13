#!/usr/bin/env node
/**
 * Frontend validation script
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating SportBeacon AI Frontend...');

// Check if we're in the right directory
if (!fs.existsSync('frontend/package.json')) {
  console.error('❌ frontend/package.json not found. Please run from project root.');
  process.exit(1);
}

try {
  // Check TypeScript compilation
  console.log('📝 Checking TypeScript compilation...');
  execSync('cd frontend && npm run typecheck', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful');
  
  // Check if build works
  console.log('🏗️ Testing build process...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build successful');
  
  console.log('🎉 Frontend validation completed successfully!');
} catch (error) {
  console.error('❌ Frontend validation failed:', error.message);
  process.exit(1);
}

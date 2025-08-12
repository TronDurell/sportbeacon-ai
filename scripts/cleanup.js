#!/usr/bin/env node

/**
 * Cross-Platform Cleanup Script
 * Handles file deletion on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}✅${colors.reset}`,
    warning: `${colors.yellow}⚠️${colors.reset}`,
    error: `${colors.red}❌${colors.reset}`,
    info: `${colors.blue}ℹ️${colors.reset}`
  }[type];
  
}

function remove(target) {
  const targetPath = path.resolve(target);
  
  if (fs.existsSync(targetPath)) {
    try {
      const stats = fs.statSync(targetPath);
      
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        log(`Deleted directory: ${target}`, 'success');
      } else {
        fs.unlinkSync(targetPath);
        log(`Deleted file: ${target}`, 'success');
      }
    } catch (error) {
      log(`Failed to delete ${target}: ${error.message}`, 'error');
    }
  } else {
    log(`Skipped (not found): ${target}`, 'warning');
  }
}

function main() {
  
  // Files and directories to remove
  const targets = [
    'node_modules',
    'package-lock.json',
    '.turbo',
    '.next',
    'dist',
    'build',
    'coverage',
    '.nyc_output',
    'tsconfig.tsbuildinfo'
  ];
  
  // Remove each target
  targets.forEach(remove);
  
  // Clean npm cache
  try {
    log('Cleaning npm cache...', 'info');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    log('npm cache cleaned successfully', 'success');
  } catch (error) {
    log(`Failed to clean npm cache: ${error.message}`, 'error');
  }
  
  // Clean yarn cache if yarn is used
  try {
    if (fs.existsSync('yarn.lock')) {
      log('Cleaning yarn cache...', 'info');
      execSync('yarn cache clean', { stdio: 'inherit' });
      log('yarn cache cleaned successfully', 'success');
    }
  } catch (error) {
    // Yarn not available, skip
  }
  
}

// Run cleanup
main(); 
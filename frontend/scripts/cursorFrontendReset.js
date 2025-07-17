#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = __dirname;
const FOLDERS_TO_DELETE = [
  'node_modules',
  'dist',
  'build',
  '.cache',
  '.turbo',
  '.next',
  '.vite',
  '.parcel',
];
const PACKAGE_LOCK = 'package-lock.json';
const TAILWIND_BIN = path.join('node_modules', '.bin', 'tailwindcss');
const TAILWIND_CONFIG = 'tailwind.config.js';
const MINIMAL_TAILWIND_CONFIG = `module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: { extend: {} },
  plugins: []
}
`;

function log(msg) {
  console.log(`\x1b[36m[Cursor Automation]\x1b[0m ${msg}`);
}

function run(cmd, opts = {}) {
  log(`Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (e) {
    log(`Error running: ${cmd}`);
    throw e;
  }
}

function killNodeProcesses() {
  log('Killing all node.exe processes...');
  try {
    execSync('taskkill /F /IM node.exe /T', { stdio: 'inherit' });
  } catch (e) {
    log('No node.exe processes found or insufficient permissions.');
  }
}

function rimrafFolders() {
  FOLDERS_TO_DELETE.forEach(folder => {
    const fullPath = path.join(FRONTEND_DIR, folder);
    if (fs.existsSync(fullPath)) {
      run(`npx rimraf "${fullPath}"`);
    }
  });
}

function deletePackageLock() {
  const lockPath = path.join(FRONTEND_DIR, PACKAGE_LOCK);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    log('Deleted package-lock.json');
  }
}

function npmCacheClean() {
  run('npm cache clean --force');
}

function npmInstall() {
  run('npm install');
}

function ensureTailwindInstalled() {
  const binPath = path.join(FRONTEND_DIR, TAILWIND_BIN);
  if (!fs.existsSync(binPath)) {
    log('Tailwind not found. Installing tailwindcss, postcss, autoprefixer...');
    run('npm install -D tailwindcss postcss autoprefixer');
  } else {
    log('Tailwind is already installed.');
  }
}

function ensureTailwindConfig() {
  const configPath = path.join(FRONTEND_DIR, TAILWIND_CONFIG);
  if (!fs.existsSync(configPath)) {
    log('tailwind.config.js missing. Initializing...');
    run('npx tailwindcss init -p');
  } else {
    const content = fs.readFileSync(configPath, 'utf8').trim();
    if (!content) {
      log('tailwind.config.js is empty. Rewriting with minimal config.');
      fs.writeFileSync(configPath, MINIMAL_TAILWIND_CONFIG, 'utf8');
    } else {
      log('tailwind.config.js exists and is not empty. No action taken.');
    }
  }
}

function main() {
  process.chdir(FRONTEND_DIR);
  log('Starting full frontend reset + Tailwind repair...');
  killNodeProcesses();
  rimrafFolders();
  deletePackageLock();
  npmCacheClean();
  npmInstall();
  ensureTailwindInstalled();
  ensureTailwindConfig();
  log('✅ Frontend reset and Tailwind repair complete!');
}

main(); 
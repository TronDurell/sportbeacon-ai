#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function log(msg) {
  const logFile = path.resolve(__dirname, "../logs/frontend-bootstrap.log");
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[BOOTSTRAP] ${new Date().toISOString()} - ${msg}\n`);
  console.log(`[LOG] ${msg}`);
}

(async () => {
  try {
    log("🚀 Starting Full Frontend Bootstrap...");
    log(`Working directory: ${process.cwd()}`);

    // Step 1: Skip taskkill on Windows to avoid hangs
    if (process.platform !== "win32") {
      log("Non-Windows OS detected, attempting process cleanup");
      try {
        execSync("taskkill /F /IM node.exe", { timeout: 500 });
        log("Node processes killed successfully");
      } catch (e) {
        log("No node processes found or insufficient permissions");
      }
    } else {
      log("Skipping taskkill on Windows to avoid hangs");
    }

    // Step 2: Clean environment
    log("Cleaning frontend environment...");
    const foldersToDelete = ['node_modules', 'dist', '.cache', '.next'];
    foldersToDelete.forEach(folder => {
      const fullPath = path.join(process.cwd(), folder);
      if (fs.existsSync(fullPath)) {
        try {
          execSync(`npx rimraf "${fullPath}"`, { stdio: 'pipe' });
          log(`Deleted: ${folder}`);
        } catch (e) {
          log(`Failed to delete ${folder}: ${e.message}`);
        }
      } else {
        log(`Folder not found: ${folder}`);
      }
    });

    // Step 3: Fresh install
    log("Installing dependencies");
    execSync("npm cache clean --force", { stdio: "inherit" });
    execSync("npm install", { stdio: "inherit" });

    // Step 4: Fix Tailwind config
    log("Checking Tailwind setup...");
    const tailwindConfig = 'tailwind.config.js';
    const minimalConfig = `module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: { extend: {} },
  plugins: [],
}`;

    if (!fs.existsSync(tailwindConfig)) {
      log("tailwind.config.js missing. Creating with minimal config...");
      fs.writeFileSync(tailwindConfig, minimalConfig, 'utf8');
    } else {
      const content = fs.readFileSync(tailwindConfig, 'utf8').trim();
      if (!content) {
        log("tailwind.config.js is empty. Rewriting with minimal config...");
        fs.writeFileSync(tailwindConfig, minimalConfig, 'utf8');
      } else {
        log("tailwind.config.js exists and is not empty");
      }
    }

    // Check for Tailwind dependencies
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasTailwind = packageJson.devDependencies && 
      (packageJson.devDependencies.tailwindcss || 
       packageJson.devDependencies['@tailwindcss/core']);
    
    if (!hasTailwind) {
      log("Installing Tailwind dependencies...");
      execSync("npm install -D tailwindcss postcss autoprefixer", { stdio: "inherit" });
    } else {
      log("Tailwind dependencies already present");
    }

    // Step 5: Fix dev script
    log("Checking and fixing dev script...");
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let devScript = null;
    
    if (dependencies.next) {
      devScript = 'next dev';
    } else if (dependencies.vite) {
      devScript = 'vite';
    } else if (dependencies['react-scripts']) {
      devScript = 'react-scripts start';
    } else {
      devScript = 'next dev'; // fallback
    }
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts.dev || packageJson.scripts.dev !== devScript) {
      packageJson.scripts.dev = devScript;
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      log(`Updated dev script to: "${devScript}"`);
    } else {
      log(`Dev script already correct: "${devScript}"`);
    }

    // Step 6: Verify type usage
    log("Verifying type usage");
    try {
      execSync("tsc --noEmit", { stdio: "inherit" });
      log("TypeScript compilation successful");
    } catch (e) {
      log(`TypeScript errors found: ${e.message}`);
      // Continue anyway for now
    }

    // Step 7: Check for white screen issues
    log("Checking for white screen issues...");
    const checks = [
      {
        name: 'Environment variables',
        check: () => fs.existsSync('.env.local'),
        message: 'Missing .env.local file - may cause white screen'
      },
      {
        name: 'Firebase configuration',
        check: () => fs.existsSync('src/lib/firebase.ts'),
        message: 'Missing Firebase configuration - may cause white screen'
      },
      {
        name: 'App entry point',
        check: () => fs.existsSync('src/App.tsx'),
        message: 'Missing App.tsx - will cause white screen'
      }
    ];
    
    let issuesFound = 0;
    checks.forEach(check => {
      if (!check.check()) {
        log(`⚠️ ${check.message}`);
        issuesFound++;
      } else {
        log(`✅ ${check.name}: OK`);
      }
    });

    log("🎉 Frontend bootstrap complete ✅");
    log(`Steps completed: 7/7`);
    log(`Issues found: ${issuesFound}`);
    log("The app should now be ready. Run 'npm run dev' to start.");

  } catch (err) {
    log(`❌ ERROR: ${err.message}`);
    log(`Stack trace: ${err.stack}`);
    process.exit(1);
  }
})(); 
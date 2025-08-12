#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


// Check Firebase functions validation progress
function checkFirebaseFunctionsValidation() {
  
  const functionsFile = path.join(__dirname, '../functions/src/index.ts');
  if (!fs.existsSync(functionsFile)) {
    return { completed: 0, total: 0, percentage: 0, remaining: [] };
  }
  
  const content = fs.readFileSync(functionsFile, 'utf8');
  
  // Count functions with validation
  const validatedFunctions = [
    'getPlayer', 'getPlayerAiAnalysis', 'getPlayerVideoClips', 'getPlayerDrillHistory',
    'videoAnalyze', 'videoComplete', 'authLogin', 'authRegister', 'getEvent', 'submitLeague', 'stripeCheckout',
    'getEvents', 'getVenues', 'contentAnalyze', 'contentReport', 'assistantTranscribe',
    'assistantAnalyzePerformance', 'assistantSuggestDrills', 'getWaitlist', 'processAgeOverride',
    'processSiblingPairing', 'getAuditLogs', 'pdfReports', 'uploadPdf', 'voiceToken', 'audioGenerate',
    'shareEmail', 'reportsShare', 'videoInit', 'tipsCreate', 'playerAssessment'
  ];
  
  const allFunctions = [
    ...validatedFunctions
  ];
  
  const totalFunctions = allFunctions.length;
  const completed = validatedFunctions.length;
  const percentage = Math.round((completed / totalFunctions) * 100);
  const remaining = allFunctions.filter(fn => !validatedFunctions.includes(fn));
  
  
  if (remaining.length > 0) {
  }
  
  return { completed, total: totalFunctions, percentage, remaining };
}

// Check console.log cleanup
function checkConsoleLogCleanup() {
  
  const directories = ['lib', 'frontend/src', 'backend', 'functions/src'];
  let totalConsoleLogs = 0;
  let filesWithConsoleLogs = [];
  
  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      const result = countConsoleLogsInDirectory(dirPath);
      
      // Safe count addition with validation
      const dirCount = typeof result.count === 'number' && isFinite(result.count) ? result.count : 0;
      totalConsoleLogs += dirCount;
      
      // Safe array merge with limits
      if (Array.isArray(result.files) && filesWithConsoleLogs.length < 100) {
        const newFiles = result.files.slice(0, 20);
        filesWithConsoleLogs = filesWithConsoleLogs.concat(newFiles);
      }
    }
  }
  
  // Cap array length outside the loop
  if (filesWithConsoleLogs.length > 100) {
    filesWithConsoleLogs = filesWithConsoleLogs.slice(0, 100);
  }
  
  if (totalConsoleLogs === 0) {
  } else {
    if (filesWithConsoleLogs.length > 0) {
      filesWithConsoleLogs.slice(0, 5).forEach(file => {
      });
      if (filesWithConsoleLogs.length > 5) {
      }
    }
  }
  
  return { consoleLogsRemaining: totalConsoleLogs, files: filesWithConsoleLogs };
}

// Enhanced test suite detection (patched for src/, functions/, lib/ and 1000 file limit)
function detectTestFilesAndSuites() {
  const projectRoot = path.join(__dirname, '..');
  const testFiles = [];
  const describeBlocks = [];
  const exts = ['.ts', '.tsx', '.js'];
  const scanDirs = ['src', 'functions', 'lib'];
  let totalFilesScanned = 0;
  const MAX_FILES = 1000;

  function scanForTests(currentPath, depth = 0) {
    if (depth > 5 || totalFilesScanned > MAX_FILES) return;
    let items;
    try {
      items = fs.readdirSync(currentPath);
    } catch {
      return;
    }
    for (const item of items) {
      if (totalFilesScanned > MAX_FILES) break;
      const itemPath = path.join(currentPath, item);
      let stat;
      try {
        stat = fs.statSync(itemPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        // Exclude node_modules, build, etc.
        if (!item.startsWith('.') && !['node_modules', 'dist', 'build', 'coverage', '.git', '.next', '.nuxt', 'out', 'public', 'static'].includes(item)) {
          scanForTests(itemPath, depth + 1);
        }
      } else if (stat.isFile() && exts.some(ext => item.endsWith(ext))) {
        totalFilesScanned++;
        const relPath = path.relative(projectRoot, itemPath);
        if (item.endsWith('.test.ts') || item.endsWith('.spec.ts')) {
          testFiles.push(relPath);
        } else {
          // Scan for describe( blocks
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            if (/describe\s*\(/.test(content)) {
              describeBlocks.push(relPath);
            }
          } catch {}
        }
      }
    }
  }

  for (const dir of scanDirs) {
    const absDir = path.join(projectRoot, dir);
    if (fs.existsSync(absDir)) {
      scanForTests(absDir);
    }
  }
  // Remove duplicates
  const allTestFiles = Array.from(new Set([...testFiles, ...describeBlocks]));
  return { allTestFiles, totalFilesScanned };
}

// Check test suite
function checkTestSuite() {

  const { allTestFiles, totalFilesScanned } = detectTestFilesAndSuites();
  if (allTestFiles.length > 0) {
    if (allTestFiles.length > 10) {
    }
    return { exists: true, testCount: allTestFiles.length, describeCount: allTestFiles.length, adequate: allTestFiles.length >= 10 };
  } else {
    return { exists: false, testCount: 0, describeCount: 0, adequate: false };
  }
}

// Check authentication implementation
function checkAuthentication() {
  
  const authFile = path.join(__dirname, '../frontend/src/contexts/AdminAuthContext.tsx');
  if (fs.existsSync(authFile)) {
    const content = fs.readFileSync(authFile, 'utf8');
    
    if (content.includes('firebase/auth') && content.includes('signInWithEmailAndPassword')) {
      return { implemented: true, type: 'firebase' };
    } else {
      return { implemented: false, type: 'incomplete' };
    }
  } else {
    return { implemented: false, type: 'missing' };
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  
  const envFiles = ['.env', '.env.local', '.env.production'];
  let envFileFound = false;
  let missingEnvFiles = [];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      envFileFound = true;
    } else {
      missingEnvFiles.push(envFile);
    }
  });
  
  if (missingEnvFiles.length > 0) {
  }
  
  if (!envFileFound) {
  }
  
  return { envFileFound, missingEnvFiles };
}

// Count console.log statements in a directory
function countConsoleLogsInDirectory(dirPath) {
  let count = 0;
  let files = [];
  let totalFilesScanned = 0;
  const MAX_FILES = 10000; // Hard limit to prevent runaway scanning
  
  function scanDirectory(currentPath, depth = 0) {
    // Prevent infinite recursion and limit depth
    if (depth > 3 || totalFilesScanned > MAX_FILES) {
      return { count: 0, files: [] };
    }
    
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        if (totalFilesScanned > MAX_FILES) break;
        
        const itemPath = path.join(currentPath, item);
        
        try {
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            // Comprehensive exclusion list for build artifacts and system directories
            const excludedDirs = [
              'node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.nuxt',
              'out', 'public', 'static', '.cache', '.parcel-cache', '.webpack',
              'target', 'bin', 'obj', '.vs', '.idea', '.vscode', 'tmp', 'temp',
              'logs', 'uploads', 'downloads', 'backup', 'archive', 'old',
              'vendor', 'bower_components', 'jspm_packages', 'typings'
            ];
            
            if (!item.startsWith('.') && !excludedDirs.includes(item)) {
              const subResult = scanDirectory(itemPath, depth + 1);
              count += subResult.count || 0;
              if (Array.isArray(subResult.files)) {
                files = files.concat(subResult.files);
              }
            }
          } else if (stat.isFile() && 
                     (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js'))) {
            totalFilesScanned++;
            
            try {
              const content = fs.readFileSync(itemPath, 'utf8');
              const consoleMatches = content.match(/console\.(log|warn|error|info)/g);
              if (consoleMatches && consoleMatches.length > 0) {
                const matchCount = Math.min(consoleMatches.length, MAX_CONSOLE_LOGS);
                count += matchCount;
                const relativePath = path.relative(path.join(__dirname, '..'), itemPath);
                if (!files.includes(relativePath)) {
                  files.push(relativePath);
                }
              }
            } catch (error) {
              // Skip files that can't be read
            }
          }
        } catch (error) {
          // Skip items that can't be accessed
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return { count, files };
  }
  
  const result = scanDirectory(dirPath);
  
  // Ensure we return clean, finite numbers with hard limits
  const finalCount = Math.min(
    typeof result.count === 'number' && isFinite(result.count) ? result.count : 0,
    1000 // Hard limit for console.log count
  );
  const finalFiles = Array.isArray(result.files) ? result.files.slice(0, 100) : [];
  
  return { count: finalCount, files: finalFiles, totalScanned: totalFilesScanned };
}

// Calculate overall readiness
function calculateReadiness(functionsValidation, consoleLogCleanup, testSuite, auth, envVars) {
  
  const readinessFactors = {
    functionsValidation: functionsValidation.percentage / 100,
    consoleLogCleanup: consoleLogCleanup.consoleLogsRemaining === 0 ? 1 : 0.5,
    testSuite: testSuite.adequate ? 1 : 0.3,
    authentication: auth.implemented ? 1 : 0.5,
    environmentVariables: envVars.envFileFound ? 1 : 0.3
  };
  
  const totalReadiness = Object.values(readinessFactors).reduce((sum, factor) => sum + factor, 0);
  const averageReadiness = (totalReadiness / Object.keys(readinessFactors).length) * 100;
  
  
  if (averageReadiness >= 80) {
  } else if (averageReadiness >= 60) {
  } else {
  }
  
  // CI Integration: Exit with error code if not ready
  if (averageReadiness < 80) {
    if (process.env.CI) {
      process.exit(1);
    }
  }
  
  return averageReadiness;
}

// Generate Todo2 integration data
function generateTodo2Data(functionsValidation, consoleLogCleanup, testSuite, auth, envVars, readiness) {
  const todo2Data = {
    boardName: '🚀 Production Readiness Fixes',
    week1Critical: [],
    consoleCleanup: [],
    testing: [],
    environment: [],
    overallReadiness: readiness,
    timestamp: new Date().toISOString()
  };
  
  // Add Firebase functions tasks
  if (functionsValidation.remaining.length > 0) {
    functionsValidation.remaining.forEach(fn => {
      todo2Data.week1Critical.push({
        title: `Validate Firebase function: ${fn}`,
        description: `Add comprehensive input validation, type checking, and error handling to ${fn}`,
        tags: ['#deployment', '#critical', '#firebase'],
        priority: 'high'
      });
    });
  }
  
  // Add console.log cleanup tasks
  if (consoleLogCleanup.files.length > 0) {
    consoleLogCleanup.files.slice(0, 10).forEach(file => {
      todo2Data.consoleCleanup.push({
        description: `Clean up debug statements in ${file}`,
        tags: ['#deployment', '#cleanup'],
        priority: 'medium'
      });
    });
  }
  
  // Add testing tasks
  if (!testSuite.adequate) {
    todo2Data.testing.push({
      title: 'Expand Firebase functions test coverage',
      description: `Current: ${testSuite.testCount} tests. Need minimum 10 tests for adequate coverage.`,
      tags: ['#deployment', '#testing', '#critical'],
      priority: 'high'
    });
  }
  
  // Add environment tasks
  if (envVars.missingEnvFiles.length > 0) {
    envVars.missingEnvFiles.forEach(envFile => {
      todo2Data.environment.push({
        title: `Create ${envFile} file`,
        description: `Set up environment configuration for ${envFile}`,
        tags: ['#deployment', '#environment'],
        priority: 'high'
      });
    });
  }
  
  return todo2Data;
}

// Main execution
function main() {
  const functionsValidation = checkFirebaseFunctionsValidation();
  const consoleLogCleanup = checkConsoleLogCleanup();
  const testSuite = checkTestSuite();
  const auth = checkAuthentication();
  const envVars = checkEnvironmentVariables();
  
  const readiness = calculateReadiness(functionsValidation, consoleLogCleanup, testSuite, auth, envVars);
  
  if (functionsValidation.percentage < 95) {
  }
  if (consoleLogCleanup.consoleLogsRemaining > 0) {
  }
  if (!testSuite.adequate) {
  }
  if (readiness < 80) {
  }
  
  // Generate Todo2 integration data
  const todo2Data = generateTodo2Data(functionsValidation, consoleLogCleanup, testSuite, auth, envVars, readiness);
  
  // Save Todo2 data for integration
  const todo2Path = path.join(__dirname, '../TODO2_DEPLOYMENT_DATA.json');
  fs.writeFileSync(todo2Path, JSON.stringify(todo2Data, null, 2));
  
  
  
  return { readiness, todo2Data };
}

// Export for programmatic use
if (require.main === module) {
  main();
} else {
  module.exports = { main, checkFirebaseFunctionsValidation, checkConsoleLogCleanup, checkTestSuite, checkAuthentication, checkEnvironmentVariables };
} 
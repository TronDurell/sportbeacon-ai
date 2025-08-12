#!/usr/bin/env node

/**
 * Backend Integration Deployment Script
 * 
 * This script handles the deployment of the backend integration layer
 * with comprehensive validation, monitoring, and rollback capabilities.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  environments: {
    staging: {
      firebaseProject: 'sportbeacon-ai-staging',
      hostingTarget: 'staging',
      functionsTarget: 'staging',
      validateAfterDeploy: true,
      monitorHealth: true,
      autoRollback: true
    },
    production: {
      firebaseProject: 'sportbeacon-ai-production',
      hostingTarget: 'production',
      functionsTarget: 'production',
      validateAfterDeploy: true,
      monitorHealth: true,
      autoRollback: true,
      requireApproval: true
    }
  },
  healthCheckTimeout: 300000, // 5 minutes
  rollbackTimeout: 600000, // 10 minutes
  maxRetries: 3
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logStep = (step, message) => {
  log(`\n${colors.bright}${step}${colors.reset}: ${message}`, 'cyan');
};

const logSuccess = (message) => {
  log(`✅ ${message}`, 'green');
};

const logWarning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

const logError = (message) => {
  log(`❌ ${message}`, 'red');
};

const logInfo = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

// Command execution with error handling
const executeCommand = (command, options = {}) => {
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
};

// Check if Firebase CLI is installed
const checkFirebaseCLI = () => {
  logStep('Checking Firebase CLI', 'Verifying Firebase CLI installation...');
  
  const result = executeCommand('firebase --version');
  if (!result.success) {
    logError('Firebase CLI is not installed. Please install it first: npm install -g firebase-tools');
    process.exit(1);
  }
  
  logSuccess(`Firebase CLI version: ${result.output.trim()}`);
  return true;
};

// Check if user is authenticated
const checkAuthentication = () => {
  logStep('Checking Authentication', 'Verifying Firebase authentication...');
  
  const result = executeCommand('firebase projects:list');
  if (!result.success) {
    logError('Not authenticated with Firebase. Please run: firebase login');
    process.exit(1);
  }
  
  logSuccess('Firebase authentication verified');
  return true;
};

// Validate environment configuration
const validateEnvironment = (environment) => {
  logStep('Validating Environment', `Validating configuration for ${environment}...`);
  
  if (!CONFIG.environments[environment]) {
    logError(`Invalid environment: ${environment}. Valid environments: ${Object.keys(CONFIG.environments).join(', ')}`);
    process.exit(1);
  }
  
  const envConfig = CONFIG.environments[environment];
  
  // Check if Firebase project exists
  const projectResult = executeCommand(`firebase projects:list --filter="projectId:${envConfig.firebaseProject}"`);
  if (!projectResult.success || !projectResult.output.includes(envConfig.firebaseProject)) {
    logError(`Firebase project ${envConfig.firebaseProject} not found or not accessible`);
    process.exit(1);
  }
  
  logSuccess(`Environment ${environment} validated`);
  return envConfig;
};

// Run pre-deployment tests
const runPreDeploymentTests = async () => {
  logStep('Pre-deployment Tests', 'Running comprehensive test suite...');
  
  const testCommands = [
    { name: 'Lint', command: 'npm run lint' },
    { name: 'Type Check', command: 'npm run type-check' },
    { name: 'Unit Tests', command: 'npm run test:unit' },
    { name: 'Integration Tests', command: 'npm run test:integration' },
    { name: 'Performance Tests', command: 'npm run test:performance' },
    { name: 'Security Tests', command: 'npm run test:security' }
  ];
  
  for (const test of testCommands) {
    logInfo(`Running ${test.name}...`);
    const result = executeCommand(test.command, { cwd: 'frontend' });
    
    if (!result.success) {
      logError(`${test.name} failed: ${result.error}`);
      if (test.name === 'Unit Tests' || test.name === 'Integration Tests') {
        process.exit(1);
      } else {
        logWarning(`${test.name} failed, but continuing deployment...`);
      }
    } else {
      logSuccess(`${test.name} passed`);
    }
  }
  
  logSuccess('Pre-deployment tests completed');
};

// Build application
const buildApplication = () => {
  logStep('Building Application', 'Building the application for deployment...');
  
  const result = executeCommand('npm run build', { cwd: 'frontend' });
  if (!result.success) {
    logError(`Build failed: ${result.error}`);
    process.exit(1);
  }
  
  // Verify build output
  const distPath = path.join('frontend', 'dist');
  if (!fs.existsSync(distPath)) {
    logError('Build output not found. Build may have failed.');
    process.exit(1);
  }
  
  logSuccess('Application built successfully');
  return true;
};

// Deploy to Firebase
const deployToFirebase = (environment, envConfig) => {
  logStep('Deploying to Firebase', `Deploying to ${environment} environment...`);
  
  // Set Firebase project
  const setProjectResult = executeCommand(`firebase use ${envConfig.firebaseProject}`);
  if (!setProjectResult.success) {
    logError(`Failed to set Firebase project: ${setProjectResult.error}`);
    process.exit(1);
  }
  
  // Deploy hosting
  logInfo('Deploying hosting...');
  const hostingResult = executeCommand(`firebase deploy --only hosting:${envConfig.hostingTarget}`);
  if (!hostingResult.success) {
    logError(`Hosting deployment failed: ${hostingResult.error}`);
    process.exit(1);
  }
  
  // Deploy functions
  logInfo('Deploying functions...');
  const functionsResult = executeCommand(`firebase deploy --only functions:${envConfig.functionsTarget}`);
  if (!functionsResult.success) {
    logError(`Functions deployment failed: ${functionsResult.error}`);
    process.exit(1);
  }
  
  logSuccess(`Deployment to ${environment} completed successfully`);
  return true;
};

// Validate deployment
const validateDeployment = async (environment, envConfig) => {
  if (!envConfig.validateAfterDeploy) {
    logInfo('Skipping deployment validation');
    return true;
  }
  
  logStep('Validating Deployment', 'Running post-deployment validation...');
  
  // Run smoke tests
  logInfo('Running smoke tests...');
  const smokeTestResult = executeCommand('npm run test:smoke', { cwd: 'frontend' });
  if (!smokeTestResult.success) {
    logError(`Smoke tests failed: ${smokeTestResult.error}`);
    return false;
  }
  
  // Run health checks
  logInfo('Running health checks...');
  const healthCheckResult = executeCommand('npm run monitor:health', { cwd: 'frontend' });
  if (!healthCheckResult.success) {
    logError(`Health checks failed: ${healthCheckResult.error}`);
    return false;
  }
  
  // Run performance validation
  logInfo('Running performance validation...');
  const performanceResult = executeCommand('npm run monitor:performance', { cwd: 'frontend' });
  if (!performanceResult.success) {
    logWarning(`Performance validation failed: ${performanceResult.error}`);
  }
  
  logSuccess('Deployment validation completed');
  return true;
};

// Monitor deployment health
const monitorDeploymentHealth = async (environment, envConfig) => {
  if (!envConfig.monitorHealth) {
    logInfo('Skipping health monitoring');
    return true;
  }
  
  logStep('Monitoring Health', 'Monitoring deployment health...');
  
  const startTime = Date.now();
  const maxDuration = CONFIG.healthCheckTimeout;
  
  while (Date.now() - startTime < maxDuration) {
    logInfo('Checking deployment health...');
    
    const healthResult = executeCommand('npm run monitor:health', { cwd: 'frontend' });
    if (healthResult.success) {
      logSuccess('Deployment health check passed');
      return true;
    }
    
    logWarning('Health check failed, retrying in 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  logError('Health monitoring timeout exceeded');
  return false;
};

// Rollback deployment
const rollbackDeployment = async (environment, envConfig) => {
  if (!envConfig.autoRollback) {
    logInfo('Auto-rollback disabled');
    return false;
  }
  
  logStep('Rolling Back', 'Initiating deployment rollback...');
  
  try {
    // Get previous deployment version
    const versionsResult = executeCommand('firebase hosting:versions:list');
    if (!versionsResult.success) {
      logError('Failed to get deployment versions for rollback');
      return false;
    }
    
    // Parse versions and get the previous one
    const versions = versionsResult.output.split('\n')
      .filter(line => line.includes('VERSION'))
      .map(line => line.split(/\s+/)[1])
      .filter(Boolean);
    
    if (versions.length < 2) {
      logError('No previous version available for rollback');
      return false;
    }
    
    const previousVersion = versions[1]; // Second most recent version
    
    // Rollback to previous version
    const rollbackResult = executeCommand(`firebase hosting:clone --from ${environment} --to ${environment} --version ${previousVersion}`);
    if (!rollbackResult.success) {
      logError(`Rollback failed: ${rollbackResult.error}`);
      return false;
    }
    
    logSuccess(`Rolled back to version ${previousVersion}`);
    return true;
  } catch (error) {
    logError(`Rollback error: ${error.message}`);
    return false;
  }
};

// Generate deployment report
const generateDeploymentReport = (environment, startTime, success, error = null) => {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const report = {
    environment,
    timestamp: new Date().toISOString(),
    duration: `${Math.round(duration / 1000)}s`,
    success,
    error: error?.message || null,
    steps: [
      'Firebase CLI Check',
      'Authentication Check',
      'Environment Validation',
      'Pre-deployment Tests',
      'Application Build',
      'Firebase Deployment',
      'Deployment Validation',
      'Health Monitoring'
    ]
  };
  
  // Save report
  const reportPath = path.join('reports', `deployment-${environment}-${Date.now()}.json`);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Deployment report saved to: ${reportPath}`);
  return report;
};

// Main deployment function
const deploy = async (environment) => {
  const startTime = Date.now();
  
  try {
    log(`🚀 Starting Backend Integration Deployment to ${environment}`, 'bright');
    
    // Step 1: Check Firebase CLI
    checkFirebaseCLI();
    
    // Step 2: Check authentication
    checkAuthentication();
    
    // Step 3: Validate environment
    const envConfig = validateEnvironment(environment);
    
    // Step 4: Check for approval (if required)
    if (envConfig.requireApproval) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question(`\n${colors.yellow}⚠️  Production deployment requires approval. Continue? (yes/no): ${colors.reset}`, resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        logInfo('Deployment cancelled by user');
        process.exit(0);
      }
    }
    
    // Step 5: Run pre-deployment tests
    await runPreDeploymentTests();
    
    // Step 6: Build application
    buildApplication();
    
    // Step 7: Deploy to Firebase
    deployToFirebase(environment, envConfig);
    
    // Step 8: Validate deployment
    const validationSuccess = await validateDeployment(environment, envConfig);
    if (!validationSuccess) {
      throw new Error('Deployment validation failed');
    }
    
    // Step 9: Monitor health
    const healthSuccess = await monitorDeploymentHealth(environment, envConfig);
    if (!healthSuccess) {
      throw new Error('Health monitoring failed');
    }
    
    logSuccess(`🎉 Backend Integration deployment to ${environment} completed successfully!`);
    
    // Generate success report
    generateDeploymentReport(environment, startTime, true);
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    
    // Attempt rollback
    const envConfig = CONFIG.environments[environment];
    if (envConfig && envConfig.autoRollback) {
      logWarning('Attempting automatic rollback...');
      const rollbackSuccess = await rollbackDeployment(environment, envConfig);
      
      if (rollbackSuccess) {
        logSuccess('Rollback completed successfully');
      } else {
        logError('Rollback failed');
      }
    }
    
    // Generate failure report
    generateDeploymentReport(environment, startTime, false, error);
    
    process.exit(1);
  }
};

// CLI argument parsing
const parseArguments = () => {
  const args = process.argv.slice(2);
  const environment = args[0] || 'staging';
  
  if (!CONFIG.environments[environment]) {
    logError(`Invalid environment: ${environment}`);
    logInfo(`Valid environments: ${Object.keys(CONFIG.environments).join(', ')}`);
    process.exit(1);
  }
  
  return environment;
};

// Main execution
if (require.main === module) {
  const environment = parseArguments();
  deploy(environment);
}

module.exports = {
  deploy,
  CONFIG,
  log,
  logStep,
  logSuccess,
  logWarning,
  logError,
  logInfo
}; 
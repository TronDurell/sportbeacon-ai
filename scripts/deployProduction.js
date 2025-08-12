#!/usr/bin/env node

/**
 * SportBeaconAI Production Deployment Script
 * 
 * This script handles the production deployment of SportBeaconAI backend services
 * including Firebase Functions, Vercel frontend deployment, environment configuration,
 * and comprehensive post-deployment validation.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  environments: {
    production: {
      firebaseProject: 'sportbeacon-ai-production',
      vercelProject: 'sportbeacon-ai',
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
  maxRetries: 3,
  healthCheckEndpoints: {
    firebase: 'https://us-central1-sportbeacon-ai-production.cloudfunctions.net/health',
    vercel: 'https://sportbeacon-ai.vercel.app/api/health',
    admin: 'https://admin.sportbeacon-ai.vercel.app/api/health'
  }
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

// Check if required tools are installed
const checkRequiredTools = () => {
  logStep('Checking Required Tools', 'Verifying required tools installation...');
  
  const tools = [
    { name: 'Firebase CLI', command: 'firebase --version' },
    { name: 'Vercel CLI', command: 'vercel --version' },
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' }
  ];
  
  for (const tool of tools) {
    const result = executeCommand(tool.command);
    if (!result.success) {
      logError(`${tool.name} is not installed. Please install it first.`);
      process.exit(1);
    }
    logSuccess(`${tool.name}: ${result.output.trim()}`);
  }
  
  return true;
};

// Check authentication
const checkAuthentication = () => {
  logStep('Checking Authentication', 'Verifying authentication for all services...');
  
  // Check Firebase authentication
  const firebaseResult = executeCommand('firebase projects:list');
  if (!firebaseResult.success) {
    logError('Not authenticated with Firebase. Please run: firebase login');
    process.exit(1);
  }
  
  // Check Vercel authentication
  const vercelResult = executeCommand('vercel whoami');
  if (!vercelResult.success) {
    logError('Not authenticated with Vercel. Please run: vercel login');
    process.exit(1);
  }
  
  logSuccess('Authentication verified for all services');
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
  
  // Check if Vercel project exists
  const vercelProjectResult = executeCommand(`vercel ls --scope=team`);
  if (!vercelProjectResult.success) {
    logWarning('Could not verify Vercel project. Continuing...');
  }
  
  logSuccess(`Environment ${environment} validated`);
  return envConfig;
};

// Configure environment variables
const configureEnvironmentVariables = async (environment) => {
  logStep('Configuring Environment Variables', 'Setting up production environment variables...');
  
  const envConfig = CONFIG.environments[environment];
  
  // Check if Doppler is available
  const dopplerResult = executeCommand('doppler --version');
  if (dopplerResult.success) {
    logInfo('Using Doppler for environment variable management...');
    
    // Set Doppler project
    const setProjectResult = executeCommand(`doppler setup --project ${envConfig.firebaseProject} --config production`);
    if (!setProjectResult.success) {
      logWarning('Could not set Doppler project. Using .env.production file...');
    } else {
      logSuccess('Doppler project configured');
      return true;
    }
  }
  
  // Fallback to .env.production file
  logInfo('Using .env.production file for environment variables...');
  
  const envFilePath = path.join('config', 'production.env');
  if (!fs.existsSync(envFilePath)) {
    logError(`Environment file not found: ${envFilePath}`);
    process.exit(1);
  }
  
  // Validate environment variables
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_SERVICE_ACCOUNT',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'VERCEL_TOKEN',
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      logError(`Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  }
  
  logSuccess('Environment variables configured');
  return true;
};

// Deploy Firebase Functions
const deployFirebaseFunctions = (environment, envConfig) => {
  logStep('Deploying Firebase Functions', `Deploying functions to ${environment}...`);
  
  // Set Firebase project
  const setProjectResult = executeCommand(`firebase use ${envConfig.firebaseProject}`);
  if (!setProjectResult.success) {
    logError(`Failed to set Firebase project: ${setProjectResult.error}`);
    process.exit(1);
  }
  
  // Deploy functions
  logInfo('Deploying Firebase Functions...');
  const functionsResult = executeCommand(`firebase deploy --only functions:${envConfig.functionsTarget}`);
  if (!functionsResult.success) {
    logError(`Firebase Functions deployment failed: ${functionsResult.error}`);
    process.exit(1);
  }
  
  logSuccess('Firebase Functions deployed successfully');
  return true;
};

// Deploy Frontend to Vercel
const deployFrontend = (environment, envConfig) => {
  logStep('Deploying Frontend', `Deploying frontend to Vercel ${environment}...`);
  
  // Navigate to frontend directory
  const originalCwd = process.cwd();
  process.chdir('frontend');
  
  try {
    // Build the application
    logInfo('Building frontend application...');
    const buildResult = executeCommand('npm run build');
    if (!buildResult.success) {
      logError(`Frontend build failed: ${buildResult.error}`);
      process.exit(1);
    }
    
    // Deploy to Vercel
    logInfo('Deploying to Vercel...');
    const deployResult = executeCommand('vercel --prod --yes');
    if (!deployResult.success) {
      logError(`Vercel deployment failed: ${deployResult.error}`);
      process.exit(1);
    }
    
    logSuccess('Frontend deployed to Vercel successfully');
    return true;
  } finally {
    process.chdir(originalCwd);
  }
};

// Deploy Admin Dashboard to Vercel
const deployAdminDashboard = (environment, envConfig) => {
  logStep('Deploying Admin Dashboard', `Deploying admin dashboard to Vercel ${environment}...`);
  
  // Navigate to admin directory (if separate)
  const adminPath = path.join('frontend', 'admin');
  if (!fs.existsSync(adminPath)) {
    logInfo('Admin dashboard not found in separate directory. Skipping...');
    return true;
  }
  
  const originalCwd = process.cwd();
  process.chdir(adminPath);
  
  try {
    // Build the admin application
    logInfo('Building admin dashboard...');
    const buildResult = executeCommand('npm run build');
    if (!buildResult.success) {
      logError(`Admin dashboard build failed: ${buildResult.error}`);
      process.exit(1);
    }
    
    // Deploy to Vercel
    logInfo('Deploying admin dashboard to Vercel...');
    const deployResult = executeCommand('vercel --prod --yes');
    if (!deployResult.success) {
      logError(`Admin dashboard deployment failed: ${deployResult.error}`);
      process.exit(1);
    }
    
    logSuccess('Admin dashboard deployed to Vercel successfully');
    return true;
  } finally {
    process.chdir(originalCwd);
  }
};

// Health check function
const performHealthCheck = (url, timeout = 10000) => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.get(url, { timeout }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ success: true, statusCode: res.statusCode });
      } else {
        resolve({ success: false, statusCode: res.statusCode });
      }
    });
    
    req.on('error', () => {
      resolve({ success: false, error: 'Connection failed' });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
};

// Validate deployment with health checks
const validateDeployment = async (environment, envConfig) => {
  if (!envConfig.validateAfterDeploy) {
    logInfo('Skipping deployment validation');
    return true;
  }
  
  logStep('Validating Deployment', 'Running post-deployment health checks...');
  
  const healthChecks = [
    { name: 'Firebase Functions', url: CONFIG.healthCheckEndpoints.firebase },
    { name: 'Frontend', url: CONFIG.healthCheckEndpoints.vercel },
    { name: 'Admin Dashboard', url: CONFIG.healthCheckEndpoints.admin }
  ];
  
  let allChecksPassed = true;
  
  for (const check of healthChecks) {
    logInfo(`Checking ${check.name}...`);
    const result = await performHealthCheck(check.url);
    
    if (result.success) {
      logSuccess(`${check.name} health check passed (${result.statusCode})`);
    } else {
      logError(`${check.name} health check failed: ${result.error || result.statusCode}`);
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    logError('Some health checks failed');
    return false;
  }
  
  logSuccess('All health checks passed');
  return true;
};

// Run post-deployment tests
const runPostDeployTests = async (environment) => {
  logStep('Running Post-Deploy Tests', 'Executing comprehensive post-deployment tests...');
  
  const testCommands = [
    { name: 'Data Flow Tests', command: 'npm run test:dataflow' },
    { name: 'Authentication Tests', command: 'npm run test:auth' },
    { name: 'Webhook Tests', command: 'npm run test:webhooks' },
    { name: 'Performance Tests', command: 'npm run test:performance' },
    { name: 'End-to-End Tests', command: 'npm run test:e2e' }
  ];
  
  for (const test of testCommands) {
    logInfo(`Running ${test.name}...`);
    const result = executeCommand(test.command, { cwd: 'frontend' });
    
    if (!result.success) {
      logError(`${test.name} failed: ${result.error}`);
      if (test.name === 'Data Flow Tests' || test.name === 'Authentication Tests') {
        return false;
      } else {
        logWarning(`${test.name} failed, but continuing...`);
      }
    } else {
      logSuccess(`${test.name} passed`);
    }
  }
  
  logSuccess('Post-deployment tests completed');
  return true;
};

// Setup monitoring dashboard
const setupMonitoring = async (environment) => {
  logStep('Setting Up Monitoring', 'Configuring production monitoring dashboard...');
  
  // Create monitoring directory
  const monitoringDir = 'monitoring';
  if (!fs.existsSync(monitoringDir)) {
    fs.mkdirSync(monitoringDir, { recursive: true });
  }
  
  // Create Grafana dashboard configuration
  const grafanaDashboard = {
    dashboard: {
      title: 'SportBeaconAI Production Dashboard',
      tags: ['sportbeacon', 'production'],
      timezone: 'browser',
      panels: [
        {
          title: 'Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])',
              legendFormat: '{{method}} {{route}}'
            }
          ]
        },
        {
          title: 'Error Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total{status=~"5.."}[5m])',
              legendFormat: '{{method}} {{route}}'
            }
          ]
        },
        {
          title: 'Active Users',
          type: 'stat',
          targets: [
            {
              expr: 'sum(active_users_total)',
              legendFormat: 'Active Users'
            }
          ]
        }
      ]
    }
  };
  
  fs.writeFileSync(
    path.join(monitoringDir, 'dashboard.json'),
    JSON.stringify(grafanaDashboard, null, 2)
  );
  
  // Create alerting configuration
  const alertingConfig = {
    alerts: [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 0.05',
        duration: '5m',
        severity: 'critical'
      },
      {
        name: 'High Response Time',
        condition: 'response_time > 2s',
        duration: '5m',
        severity: 'warning'
      },
      {
        name: 'Service Down',
        condition: 'up == 0',
        duration: '1m',
        severity: 'critical'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(monitoringDir, 'alerts.json'),
    JSON.stringify(alertingConfig, null, 2)
  );
  
  logSuccess('Monitoring dashboard configured');
  return true;
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
      'Required Tools Check',
      'Authentication Check',
      'Environment Validation',
      'Environment Variables Configuration',
      'Firebase Functions Deployment',
      'Frontend Deployment',
      'Admin Dashboard Deployment',
      'Deployment Validation',
      'Post-Deploy Tests',
      'Monitoring Setup'
    ],
    healthChecks: Object.keys(CONFIG.healthCheckEndpoints).map(service => ({
      service,
      url: CONFIG.healthCheckEndpoints[service],
      status: 'pending'
    }))
  };
  
  // Save report
  const reportPath = path.join('reports', `production-deployment-${Date.now()}.json`);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logInfo(`Deployment report saved to: ${reportPath}`);
  return report;
};

// Main deployment function
const deploy = async (environment) => {
  const startTime = Date.now();
  
  try {
    log(`🚀 Starting SportBeaconAI Production Deployment to ${environment}`, 'bright');
    
    // Step 1: Check required tools
    checkRequiredTools();
    
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
    
    // Step 5: Configure environment variables
    await configureEnvironmentVariables(environment);
    
    // Step 6: Deploy Firebase Functions
    deployFirebaseFunctions(environment, envConfig);
    
    // Step 7: Deploy Frontend
    deployFrontend(environment, envConfig);
    
    // Step 8: Deploy Admin Dashboard
    deployAdminDashboard(environment, envConfig);
    
    // Step 9: Validate deployment
    const validationSuccess = await validateDeployment(environment, envConfig);
    if (!validationSuccess) {
      throw new Error('Deployment validation failed');
    }
    
    // Step 10: Run post-deployment tests
    const testSuccess = await runPostDeployTests(environment);
    if (!testSuccess) {
      throw new Error('Post-deployment tests failed');
    }
    
    // Step 11: Setup monitoring
    await setupMonitoring(environment);
    
    logSuccess(`🎉 SportBeaconAI production deployment to ${environment} completed successfully!`);
    
    // Generate success report
    generateDeploymentReport(environment, startTime, true);
    
  } catch (error) {
    logError(`Production deployment failed: ${error.message}`);
    
    // Generate failure report
    generateDeploymentReport(environment, startTime, false, error);
    
    process.exit(1);
  }
};

// CLI argument parsing
const parseArguments = () => {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  
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
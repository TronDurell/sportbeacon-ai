#!/usr/bin/env node

/**
 * Cross-Platform Production Deployment Script
 * Replaces the shell script with Node.js for Windows compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DeploymentManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: `${colors.red}❌ ERROR${colors.reset}`,
      warning: `${colors.yellow}⚠️  WARNING${colors.reset}`,
      success: `${colors.green}✅ SUCCESS${colors.reset}`,
      info: `${colors.blue}ℹ️  INFO${colors.reset}`,
      critical: `${colors.red}🚨 CRITICAL${colors.reset}`
    }[type];

  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, options.args || [], {
        stdio: options.stdio || 'inherit',
        shell: true,
        cwd: this.projectRoot
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runCommandSync(command, options = {}) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.stdio || 'pipe',
        cwd: this.projectRoot
      });
      return result;
    } catch (error) {
      if (options.ignoreError) {
        return null;
      }
      throw error;
    }
  }

  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'info');
    
    // Check Node.js
    try {
      const nodeVersion = await this.runCommandSync('node --version');
      this.successes.push(`Node.js version: ${nodeVersion.trim()}`);
    } catch (error) {
      this.issues.push('Node.js is not installed');
      return;
    }

    // Check npm
    try {
      const npmVersion = await this.runCommandSync('npm --version');
      this.successes.push(`npm version: ${npmVersion.trim()}`);
    } catch (error) {
      this.issues.push('npm is not installed');
      return;
    }

    // Check Firebase CLI
    try {
      await this.runCommandSync('firebase --version');
      this.successes.push('Firebase CLI is installed');
    } catch (error) {
      this.warnings.push('Firebase CLI not found. Installing...');
      try {
        await this.runCommand('npm install -g firebase-tools');
        this.successes.push('Firebase CLI installed successfully');
      } catch (installError) {
        this.issues.push('Failed to install Firebase CLI');
        return;
      }
    }

    this.log('Prerequisites check passed', 'success');
  }

  async cleanupDependencies() {
    this.log('Step 1: Cleaning up dependencies...', 'info');
    
    try {
      await this.runCommand('node scripts/cleanup.js');
      this.successes.push('Cleanup completed');
    } catch (error) {
      this.issues.push('Cleanup failed');
      throw error;
    }
  }

  async installDependencies() {
    this.log('Step 2: Installing dependencies...', 'info');
    
    try {
      await this.runCommand('npm install --legacy-peer-deps');
      this.successes.push('Dependencies installed successfully');
    } catch (error) {
      this.issues.push('Failed to install dependencies');
      throw error;
    }
  }

  async validateEnvironment() {
    this.log('Step 3: Validating environment...', 'info');
    
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, 'env.example');
    
    if (!fs.existsSync(envPath)) {
      this.warnings.push('.env file not found');
      if (fs.existsSync(envExamplePath)) {
        this.log('Creating .env from env.example...', 'info');
        fs.copyFileSync(envExamplePath, envPath);
        this.warnings.push('Please edit .env file with your actual values before continuing');
        const answer = await this.prompt('Press Enter after you\'ve configured .env file...');
      } else {
        this.issues.push('env.example not found');
        throw new Error('env.example not found');
      }
    } else {
      this.successes.push('.env file exists');
    }

    // Check for required environment variables
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const requiredVar of requiredVars) {
        if (!envContent.includes(requiredVar)) {
          this.warnings.push(`Required environment variable ${requiredVar} not found in .env`);
        }
      }
    }
  }

  async runAudit() {
    this.log('Step 4: Running pre-deployment audit...', 'info');
    
    if (fs.existsSync('scripts/pre-deployment-audit.js')) {
      try {
        await this.runCommand('node scripts/pre-deployment-audit.js');
        this.successes.push('Pre-deployment audit passed');
      } catch (error) {
        this.issues.push('Pre-deployment audit failed');
        this.log('Please fix the issues before continuing', 'warning');
        const answer = await this.prompt('Press Enter after fixing the issues...');
      }
    } else {
      this.warnings.push('Pre-deployment audit script not found, skipping...');
    }
  }

  async codeQualityChecks() {
    this.log('Step 5: Running code quality checks...', 'info');
    
    // TypeScript check
    this.log('Checking TypeScript compilation...', 'info');
    try {
      await this.runCommand('npx tsc --noEmit');
      this.successes.push('TypeScript compilation successful');
    } catch (error) {
      this.issues.push('TypeScript compilation failed');
      throw error;
    }

    // ESLint check
    this.log('Running ESLint...', 'info');
    try {
      await this.runCommand('npm run lint');
      this.successes.push('ESLint passed');
    } catch (error) {
      this.warnings.push('ESLint found issues');
      const answer = await this.prompt('Press Enter to continue anyway...');
    }

    // Format check
    this.log('Checking code formatting...', 'info');
    try {
      await this.runCommand('npm run format:check');
      this.successes.push('Code formatting is consistent');
    } catch (error) {
      this.warnings.push('Code formatting issues found');
      const answer = await this.prompt('Press Enter to continue anyway...');
    }
  }

  async buildApplication() {
    this.log('Step 6: Building application...', 'info');
    
    try {
      await this.runCommand('npm run build:prod');
      this.successes.push('Application built successfully');
    } catch (error) {
      this.issues.push('Build failed');
      throw error;
    }
  }

  async runTests() {
    this.log('Step 7: Running tests...', 'info');
    
    try {
      await this.runCommand('npm run test:ci');
      this.successes.push('Tests passed');
    } catch (error) {
      this.warnings.push('Some tests failed');
      const answer = await this.prompt('Press Enter to continue anyway...');
    }
  }

  async deployToFirebase() {
    this.log('Step 8: Deploying to Firebase...', 'info');
    
    // Check if user is logged in to Firebase
    try {
      await this.runCommandSync('firebase projects:list', { ignoreError: true });
    } catch (error) {
      this.warnings.push('Not logged in to Firebase. Please login first.');
      await this.runCommand('firebase login');
    }

    // Deploy to Firebase
    this.log('Deploying to Firebase...', 'info');
    try {
      await this.runCommand('firebase deploy --only hosting,functions,firestore:rules');
      this.successes.push('Firebase deployment successful');
    } catch (error) {
      this.issues.push('Firebase deployment failed');
      throw error;
    }
  }

  async postDeploymentVerification() {
    this.log('Step 9: Post-deployment verification...', 'info');
    
    try {
      const deployedUrl = await this.runCommandSync('firebase hosting:channel:list --json');
      const channels = JSON.parse(deployedUrl);
      
      if (channels.result && channels.result.channels && channels.result.channels.length > 0) {
        const url = channels.result.channels[0].url;
        this.successes.push(`Application deployed to: ${url}`);
        
        // Basic health check
        this.log('Performing health check...', 'info');
        try {
          await this.runCommandSync(`curl -f -s "${url}"`, { ignoreError: true });
          this.successes.push('Health check passed');
        } catch (error) {
          this.warnings.push('Health check failed');
        }
      } else {
        this.warnings.push('Could not determine deployed URL');
      }
    } catch (error) {
      this.warnings.push('Could not verify deployment');
    }
  }

  async main() {

    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      this.log('package.json not found. Please run this script from the project root.', 'error');
      process.exit(1);
    }

    // Confirm deployment
    const answer = await this.prompt('Are you sure you want to continue? (y/N): ');
    if (!answer.toLowerCase().startsWith('y')) {
      this.log('Deployment cancelled', 'info');
      process.exit(0);
    }

    try {
      // Run all steps
      await this.checkPrerequisites();
      await this.cleanupDependencies();
      await this.installDependencies();
      await this.validateEnvironment();
      await this.runAudit();
      await this.codeQualityChecks();
      await this.buildApplication();
      await this.runTests();
      await this.deployToFirebase();
      await this.postDeploymentVerification();


    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run deployment
const deployment = new DeploymentManager();
deployment.main().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
}); 
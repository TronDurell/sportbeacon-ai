#!/usr/bin/env node

/**
 * SportBeaconAI Pre-Deployment Audit Script
 * Performs comprehensive security and deployment readiness checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class PreDeploymentAudit {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.projectRoot = process.cwd();
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

  async runAudit() {
    
    try {
      await this.checkDependencies();
      await this.checkEnvironmentVariables();
      await this.checkSecurityVulnerabilities();
      await this.checkCodeQuality();
      await this.checkFirebaseConfiguration();
      await this.checkTestCoverage();
      await this.checkBuildProcess();
      
      this.generateReport();
    } catch (error) {
      this.log(`Audit failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'info');
    
    // Check if package.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      this.issues.push('package.json not found');
      return;
    }

    // Check for outdated dependencies
    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
      const outdated = JSON.parse(outdatedOutput);
      if (Object.keys(outdated).length > 0) {
        this.warnings.push(`${Object.keys(outdated).length} outdated dependencies found`);
      }
    } catch (error) {
      // No outdated dependencies
    }

    // Check for security vulnerabilities
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
      const audit = JSON.parse(auditOutput);
      if (audit.metadata.vulnerabilities.total > 0) {
        this.issues.push(`${audit.metadata.vulnerabilities.total} security vulnerabilities found`);
      } else {
        this.successes.push('No security vulnerabilities found in dependencies');
      }
    } catch (error) {
      this.warnings.push('Could not run npm audit');
    }
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...', 'info');
    
    const envExamplePath = path.join(this.projectRoot, 'env.example');
    const envPath = path.join(this.projectRoot, '.env');
    
    if (!fs.existsSync(envExamplePath)) {
      this.issues.push('env.example not found');
      return;
    }

    if (!fs.existsSync(envPath)) {
      this.warnings.push('.env file not found - create from env.example');
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

  async checkSecurityVulnerabilities() {
    this.log('Checking security vulnerabilities...', 'info');
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /sk_live_[a-zA-Z0-9]+/g,
      /sk_test_[a-zA-Z0-9]+/g,
      /pk_live_[a-zA-Z0-9]+/g,
      /pk_test_[a-zA-Z0-9]+/g,
      /AIza[a-zA-Z0-9_-]{35}/g,
      /[a-zA-Z0-9_-]{28}@[a-zA-Z0-9_-]{6}\.iam\.gserviceaccount\.com/g
    ];

    const filesToCheck = [
      'frontend/**/*.{ts,tsx,js,jsx}',
      'backend/**/*.{py,js,ts}',
      'lib/**/*.{ts,js}',
      '*.json',
      '*.md'
    ];

    let foundSecrets = false;
    for (const pattern of secretPatterns) {
      try {
        const grepOutput = execSync(`grep -r "${pattern.source}" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.json" --include="*.md"`, { encoding: 'utf8', stdio: 'pipe' });
        if (grepOutput.trim()) {
          this.issues.push(`Potential secret found: ${pattern.source}`);
          foundSecrets = true;
        }
      } catch (error) {
        // No matches found
      }
    }

    if (!foundSecrets) {
      this.successes.push('No hardcoded secrets found');
    }

    // Check for SQL injection vulnerabilities
    const sqlPatterns = [
      /f\".*SELECT/g,
      /f\".*INSERT/g,
      /f\".*UPDATE/g,
      /f\".*DELETE/g,
      /\.format\(.*SELECT/g,
      /\.format\(.*INSERT/g,
      /\.format\(.*UPDATE/g,
      /\.format\(.*DELETE/g
    ];

    let foundSQLInjection = false;
    for (const pattern of sqlPatterns) {
      try {
        const grepOutput = execSync(`grep -r "${pattern.source}" . --include="*.py" --include="*.js" --include="*.ts"`, { encoding: 'utf8', stdio: 'pipe' });
        if (grepOutput.trim()) {
          this.issues.push(`Potential SQL injection: ${pattern.source}`);
          foundSQLInjection = true;
        }
      } catch (error) {
        // No matches found
      }
    }

    if (!foundSQLInjection) {
      this.successes.push('No SQL injection vulnerabilities found');
    }

    // Check for XSS vulnerabilities
    const xssPatterns = [
      /dangerouslySetInnerHTML/g,
      /innerHTML/g,
      /document\.write/g,
      /eval\(/g
    ];

    let foundXSS = false;
    for (const pattern of xssPatterns) {
      try {
        const grepOutput = execSync(`grep -r "${pattern.source}" . --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js"`, { encoding: 'utf8', stdio: 'pipe' });
        if (grepOutput.trim()) {
          this.warnings.push(`Potential XSS vulnerability: ${pattern.source}`);
          foundXSS = true;
        }
      } catch (error) {
        // No matches found
      }
    }

    if (!foundXSS) {
      this.successes.push('No XSS vulnerabilities found');
    }
  }

  async checkCodeQuality() {
    this.log('Checking code quality...', 'info');
    
    // Check TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.successes.push('TypeScript compilation successful');
    } catch (error) {
      this.issues.push('TypeScript compilation failed');
    }

    // Check ESLint
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.successes.push('ESLint passed');
    } catch (error) {
      this.warnings.push('ESLint found issues');
    }

    // Check Prettier
    try {
      execSync('npm run format:check', { stdio: 'pipe' });
      this.successes.push('Code formatting is consistent');
    } catch (error) {
      this.warnings.push('Code formatting issues found');
    }
  }

  async checkFirebaseConfiguration() {
    this.log('Checking Firebase configuration...', 'info');
    
    const firebaseFiles = [
      'firebase.json',
      '.firebaserc',
      'firestore.rules',
      'firestore.indexes.json'
    ];

    for (const file of firebaseFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.successes.push(`${file} exists`);
      } else {
        this.warnings.push(`${file} not found`);
      }
    }

    // Check Firestore rules
    const firestoreRulesPath = path.join(this.projectRoot, 'firestore.rules');
    if (fs.existsSync(firestoreRulesPath)) {
      const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');
      if (rulesContent.includes('allow read, write')) {
        this.issues.push('Firestore rules may be too permissive');
      } else {
        this.successes.push('Firestore rules appear secure');
      }
    }
  }

  async checkTestCoverage() {
    this.log('Checking test coverage...', 'info');
    
    try {
      const testOutput = execSync('npm run test:coverage', { encoding: 'utf8', stdio: 'pipe' });
      
      // Parse coverage output
      const coverageMatch = testOutput.match(/All files\s+\|\s+(\d+\.\d+)/);
      if (coverageMatch) {
        const coverage = parseFloat(coverageMatch[1]);
        if (coverage >= 80) {
          this.successes.push(`Test coverage: ${coverage}%`);
        } else {
          this.warnings.push(`Test coverage below 80%: ${coverage}%`);
        }
      }
    } catch (error) {
      this.warnings.push('Could not run test coverage');
    }
  }

  async checkBuildProcess() {
    this.log('Checking build process...', 'info');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.successes.push('Production build successful');
    } catch (error) {
      this.issues.push('Production build failed');
    }
  }

  generateReport() {
    

    if (this.successes.length > 0) {
      this.successes.forEach(success => {
      });
    }

    if (this.warnings.length > 0) {
      this.warnings.forEach(warning => {
      });
    }

    if (this.issues.length > 0) {
      this.issues.forEach(issue => {
      });
    }

    // Deployment readiness
    const isReady = this.issues.length === 0;
    if (isReady) {
    } else {
    }

    // Generate detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        issues: this.issues.length,
        deploymentReady: isReady
      },
      successes: this.successes,
      warnings: this.warnings,
      issues: this.issues
    };

    const reportPath = path.join(this.projectRoot, 'deployment-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Exit with appropriate code
    process.exit(isReady ? 0 : 1);
  }
}

// Run the audit
const audit = new PreDeploymentAudit();
audit.runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
}); 
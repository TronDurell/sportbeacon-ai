#!/usr/bin/env node

/**
 * SportBeaconAI Preview Deployment Script
 * Deploys preview branches to Vercel with suffix -pr-[branch-name]
 * 
 * Features:
 * - Automatic branch detection
 * - Custom deployment naming
 * - Environment validation
 * - Build verification
 * - Deployment status reporting
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentConfig {
  projectName: string;
  vercelOrgId: string;
  vercelProjectId: string;
  environment: 'development' | 'staging' | 'production';
}

interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  branch: string;
  timestamp: string;
}

class PreviewDeployment {
  private projectRoot: string;
  private config: DeploymentConfig;
  private logs: string[] = [];

  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  private loadConfig(): DeploymentConfig {
    // Load from environment variables or config file
    return {
      projectName: process.env.VERCEL_PROJECT_NAME || 'sportbeacon-ai',
      vercelOrgId: process.env.VERCEL_ORG_ID || '',
      vercelProjectId: process.env.VERCEL_PROJECT_ID || '',
      environment: (process.env.NODE_ENV as any) || 'development'
    };
  }

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    this.logs.push(logEntry);
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  private getCurrentBranch(): string {
    try {
      const branch = execSync('git branch --show-current', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      }).trim();
      
      if (!branch) {
        throw new Error('Could not determine current branch');
      }
      
      return branch;
    } catch (error) {
      this.log(`Failed to get current branch: ${error}`, 'error');
      process.exit(1);
    }
  }

  private validateEnvironment(): boolean {
    this.log('🔍 Validating environment...', 'info');
    
    // Check if we're in the right directory
    if (!fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      this.log('❌ package.json not found. Please run from project root.', 'error');
      return false;
    }

    // Check if frontend directory exists
    if (!fs.existsSync(path.join(this.projectRoot, 'frontend'))) {
      this.log('❌ frontend directory not found.', 'error');
      return false;
    }

    // Check for required environment variables
    const requiredEnvVars = ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.log(`❌ Missing required environment variables: ${missingVars.join(', ')}`, 'error');
      return false;
    }

    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      this.log('❌ Vercel CLI not found. Please install with: npm i -g vercel', 'error');
      return false;
    }

    this.log('✅ Environment validation passed', 'success');
    return true;
  }

  private async installDependencies(): Promise<boolean> {
    this.log('📦 Installing dependencies...', 'info');
    
    try {
      execSync('npm ci', { 
        stdio: 'inherit',
        cwd: path.join(this.projectRoot, 'frontend')
      });
      this.log('✅ Dependencies installed', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Failed to install dependencies: ${error}`, 'error');
      return false;
    }
  }

  private async runTests(): Promise<boolean> {
    this.log('🧪 Running tests...', 'info');
    
    try {
      execSync('npm run test:ci', { 
        stdio: 'inherit',
        cwd: path.join(this.projectRoot, 'frontend')
      });
      this.log('✅ Tests passed', 'success');
      return true;
    } catch (error) {
      this.log(`⚠️ Tests failed, but continuing with deployment: ${error}`, 'warning');
      return false;
    }
  }

  private async buildApplication(): Promise<boolean> {
    this.log('🔨 Building application...', 'info');
    
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.join(this.projectRoot, 'frontend')
      });
      
      // Verify build output
      const distPath = path.join(this.projectRoot, 'frontend', 'dist');
      if (!fs.existsSync(distPath)) {
        throw new Error('Build output not found');
      }
      
      this.log('✅ Application built successfully', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Build failed: ${error}`, 'error');
      return false;
    }
  }

  private generateDeploymentName(branchName: string): string {
    // Clean branch name for URL-safe deployment name
    const cleanBranch = branchName
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    
    return `sportbeacon-ai-pr-${cleanBranch}`;
  }

  private async deployToVercel(branchName: string): Promise<DeploymentResult> {
    this.log('🚀 Deploying to Vercel...', 'info');
    
    const deploymentName = this.generateDeploymentName(branchName);
    const timestamp = new Date().toISOString();
    
    try {
      // Deploy to Vercel with custom name
      const deployCommand = [
        'vercel',
        '--name', deploymentName,
        '--prod',
        '--yes' // Skip prompts
      ];
      
      this.log(`Deploying as: ${deploymentName}`, 'info');
      
      const result = execSync(deployCommand.join(' '), {
        stdio: 'pipe',
        cwd: path.join(this.projectRoot, 'frontend'),
        encoding: 'utf8'
      });
      
      // Extract deployment URL from output
      const urlMatch = result.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : undefined;
      
      if (deploymentUrl) {
        this.log(`✅ Deployment successful: ${deploymentUrl}`, 'success');
        return {
          success: true,
          url: deploymentUrl,
          branch: branchName,
          timestamp
        };
      } else {
        throw new Error('Could not extract deployment URL from output');
      }
      
    } catch (error) {
      this.log(`❌ Deployment failed: ${error}`, 'error');
      return {
        success: false,
        error: error.toString(),
        branch: branchName,
        timestamp
      };
    }
  }

  private async validateDeployment(url: string): Promise<boolean> {
    this.log('🔍 Validating deployment...', 'info');
    
    try {
      // Simple health check
      const response = await fetch(url);
      if (response.ok) {
        this.log('✅ Deployment validation passed', 'success');
        return true;
      } else {
        this.log(`⚠️ Deployment validation failed: HTTP ${response.status}`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`⚠️ Deployment validation failed: ${error}`, 'warning');
      return false;
    }
  }

  private saveDeploymentLog(result: DeploymentResult): void {
    const logFile = path.join(this.projectRoot, 'deployment-logs', 'preview-deployments.json');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Load existing logs
    let logs: DeploymentResult[] = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      } catch (error) {
        this.log('⚠️ Could not load existing deployment logs', 'warning');
      }
    }
    
    // Add new deployment
    logs.push(result);
    
    // Keep only last 50 deployments
    if (logs.length > 50) {
      logs = logs.slice(-50);
    }
    
    // Save logs
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    this.log('📝 Deployment log saved', 'info');
  }

  private generateDeploymentReport(result: DeploymentResult): string {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const url = result.url ? `\n🔗 URL: ${result.url}` : '';
    const error = result.error ? `\n❌ Error: ${result.error}` : '';
    
    return `
🚀 SportBeaconAI Preview Deployment Report
==========================================
📅 Timestamp: ${result.timestamp}
🌿 Branch: ${result.branch}
📊 Status: ${status}${url}${error}

📋 Deployment Details:
- Project: ${this.config.projectName}
- Environment: ${this.config.environment}
- Deployment Name: ${this.generateDeploymentName(result.branch)}

📝 Next Steps:
${result.success ? 
  '- Test the deployed application' :
  '- Check the deployment logs for errors'
}
- Share the preview URL with stakeholders
- Monitor for any issues

---
Generated by SportBeaconAI Preview Deployment Script
    `.trim();
  }

  public async deploy(): Promise<DeploymentResult> {
    this.log('🚀 Starting SportBeaconAI Preview Deployment...', 'info');
    
    const branchName = this.getCurrentBranch();
    this.log(`📋 Deploying branch: ${branchName}`, 'info');
    
    // Validate environment
    if (!this.validateEnvironment()) {
      return {
        success: false,
        error: 'Environment validation failed',
        branch: branchName,
        timestamp: new Date().toISOString()
      };
    }
    
    // Install dependencies
    if (!await this.installDependencies()) {
      return {
        success: false,
        error: 'Dependency installation failed',
        branch: branchName,
        timestamp: new Date().toISOString()
      };
    }
    
    // Run tests (optional - won't fail deployment)
    await this.runTests();
    
    // Build application
    if (!await this.buildApplication()) {
      return {
        success: false,
        error: 'Build failed',
        branch: branchName,
        timestamp: new Date().toISOString()
      };
    }
    
    // Deploy to Vercel
    const result = await this.deployToVercel(branchName);
    
    // Validate deployment if successful
    if (result.success && result.url) {
      await this.validateDeployment(result.url);
    }
    
    // Save deployment log
    this.saveDeploymentLog(result);
    
    // Generate and display report
    const report = this.generateDeploymentReport(result);
    console.log('\n' + report);
    
    return result;
  }
}

// CLI interface
async function main() {
  const deployment = new PreviewDeployment();
  
  try {
    const result = await deployment.deploy();
    
    if (result.success) {
      console.log('\n🎉 Preview deployment completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Preview deployment failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Deployment script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default PreviewDeployment; 
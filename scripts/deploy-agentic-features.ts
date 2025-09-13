#!/usr/bin/env tsx

/**
 * SportBeaconAI Agentic Features Deployment Script (Node/tsx)
 * Cross-platform deployment script for agentic features
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const CONFIG_FILE = join(PROJECT_ROOT, 'config/agentic-features.json');
const BACKUP_DIR = join(PROJECT_ROOT, `deploy-backups/${new Date().toISOString().replace(/[:.]/g, '-')}`);
const LOG_FILE = join(PROJECT_ROOT, `deploy-logs/agentic-deploy-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Environment configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'sportbeacon-ai';
const STAGING_PROJECT_ID = process.env.FIREBASE_STAGING_PROJECT_ID || 'sportbeacon-ai-staging';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message: string, color: keyof typeof colors = 'blue'): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(`${colors[color]}${logMessage}${colors.reset}`);
  writeFileSync(LOG_FILE, logMessage + '\n', { flag: 'a' });
}

function error(message: string): never {
  log(`[ERROR] ${message}`, 'red');
  process.exit(1);
}

function success(message: string): void {
  log(`[SUCCESS] ${message}`, 'green');
}

function warning(message: string): void {
  log(`[WARNING] ${message}`, 'yellow');
}

// Validation functions
class DeploymentValidator {
  private projectId: string;
  private config: any;
  private results: {
    passed: number;
    failed: number;
    warnings: number;
    tests: Array<{
      test: string;
      passed: boolean;
      message: string;
      timestamp: string;
    }>;
  };

  constructor(projectId: string) {
    this.projectId = projectId;
    this.config = this.loadConfig();
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  private loadConfig(): any {
    try {
      const configData = readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (err) {
      error(`Failed to load configuration: ${err}`);
    }
  }

  async runValidation(): Promise<void> {
    log(`Starting deployment validation for project: ${this.projectId}`);
    
    // Infrastructure validation
    await this.validateFirebaseProject();
    await this.validateFirestoreRules();
    await this.validateFirestoreIndexes();
    await this.validateFirebaseFunctions();
    
    // MCP Server validation
    await this.validateMCPServer();
    await this.validateMCPTools();
    
    // Agent validation
    await this.validateVerificationAgent();
    await this.validateReportingAgent();
    
    // UI validation
    await this.validateAgentAssistant();
    
    // Feature flags validation
    await this.validateFeatureFlags();
    
    // Performance validation
    await this.validatePerformance();
    
    // Security validation
    await this.validateSecurity();
    
    this.printResults();
  }

  private async validateFirebaseProject(): Promise<void> {
    log('Validating Firebase project configuration...');
    
    try {
      const result = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
      const projects = JSON.parse(result);
      const project = projects.find((p: any) => p.projectId === this.projectId);
      
      if (!project) {
        this.addResult('firebase-project', false, `Project ${this.projectId} not found`);
        return;
      }
      
      this.addResult('firebase-project', true, `Project ${this.projectId} is accessible`);
    } catch (err) {
      this.addResult('firebase-project', false, `Failed to access project: ${err}`);
    }
  }

  private async validateFirestoreRules(): Promise<void> {
    log('Validating Firestore security rules...');
    
    try {
      // Check if rules file exists
      const rulesFile = join(PROJECT_ROOT, 'firestore.rules');
      if (!existsSync(rulesFile)) {
        this.addResult('firestore-rules-file', false, 'Firestore rules file not found');
        return;
      }
      
      // Validate rules syntax
      execSync(`firebase firestore:rules:validate --project ${this.projectId}`, { stdio: 'pipe' });
      this.addResult('firestore-rules-syntax', true, 'Firestore rules syntax is valid');
      
      // Check for agent-specific rules
      const rulesContent = readFileSync(rulesFile, 'utf8');
      const requiredRules = [
        'isAgentService',
        'agent_audit',
        'kpi_cache',
        'team_reports',
        'export_jobs',
        'notifications',
        'memory',
        'agent_states'
      ];
      
      const missingRules = requiredRules.filter(rule => !rulesContent.includes(rule));
      
      if (missingRules.length > 0) {
        this.addResult('firestore-rules-content', false, `Missing agent rules: ${missingRules.join(', ')}`);
      } else {
        this.addResult('firestore-rules-content', true, 'All required agent rules present');
      }
      
    } catch (err) {
      this.addResult('firestore-rules', false, `Firestore rules validation failed: ${err}`);
    }
  }

  private async validateFirestoreIndexes(): Promise<void> {
    log('Validating Firestore indexes...');
    
    try {
      // Check if indexes file exists
      const indexesFile = join(PROJECT_ROOT, 'firestore.indexes.json');
      if (!existsSync(indexesFile)) {
        this.addResult('firestore-indexes-file', false, 'Firestore indexes file not found');
        return;
      }
      
      // Validate indexes syntax
      execSync(`firebase firestore:indexes:validate --project ${this.projectId}`, { stdio: 'pipe' });
      this.addResult('firestore-indexes-syntax', true, 'Firestore indexes syntax is valid');
      
      // Check for agent-specific indexes
      const indexesContent = readFileSync(indexesFile, 'utf8');
      const requiredIndexes = [
        'stats_submissions',
        'agent_audit',
        'kpi_cache',
        'team_reports',
        'export_jobs',
        'notifications',
        'memory',
        'agent_states',
        'agent_activities',
        'admin_tasks',
        'rate_limits'
      ];
      
      const missingIndexes = requiredIndexes.filter(index => !indexesContent.includes(index));
      
      if (missingIndexes.length > 0) {
        this.addResult('firestore-indexes-content', false, `Missing agent indexes: ${missingIndexes.join(', ')}`);
      } else {
        this.addResult('firestore-indexes-content', true, 'All required agent indexes present');
      }
      
    } catch (err) {
      this.addResult('firestore-indexes', false, `Firestore indexes validation failed: ${err}`);
    }
  }

  private async validateFirebaseFunctions(): Promise<void> {
    log('Validating Firebase Functions...');
    
    try {
      // Check if functions are deployed
      const result = execSync(`firebase functions:list --project ${this.projectId} --json`, { encoding: 'utf8' });
      const functions = JSON.parse(result);
      
      const requiredFunctions = [
        'onStatSubmissionCreated',
        'generateWeeklyReports',
        'generateTeamReport'
      ];
      
      const deployedFunctions = functions.map((f: any) => f.name);
      const missingFunctions = requiredFunctions.filter(func => !deployedFunctions.includes(func));
      
      if (missingFunctions.length > 0) {
        this.addResult('firebase-functions', false, `Missing functions: ${missingFunctions.join(', ')}`);
      } else {
        this.addResult('firebase-functions', true, 'All required functions deployed');
      }
      
    } catch (err) {
      this.addResult('firebase-functions', false, `Functions validation failed: ${err}`);
    }
  }

  private async validateMCPServer(): Promise<void> {
    log('Validating MCP Server...');
    
    try {
      // Check if MCP server package exists
      const mcpServerPath = join(PROJECT_ROOT, 'packages/mcp-server');
      if (!existsSync(mcpServerPath)) {
        this.addResult('mcp-server-package', false, 'MCP server package not found');
        return;
      }
      
      // Check if MCP server is built
      const distPath = join(mcpServerPath, 'dist');
      if (!existsSync(distPath)) {
        this.addResult('mcp-server-build', false, 'MCP server not built');
        return;
      }
      
      // Check if main files exist
      const requiredFiles = [
        'dist/index.js',
        'dist/types.d.ts',
        'package.json'
      ];
      
      const missingFiles = requiredFiles.filter(file => !existsSync(join(mcpServerPath, file)));
      
      if (missingFiles.length > 0) {
        this.addResult('mcp-server-files', false, `Missing MCP server files: ${missingFiles.join(', ')}`);
      } else {
        this.addResult('mcp-server-files', true, 'All MCP server files present');
      }
      
    } catch (err) {
      this.addResult('mcp-server', false, `MCP server validation failed: ${err}`);
    }
  }

  private async validateMCPTools(): Promise<void> {
    log('Validating MCP Tools...');
    
    try {
      const toolsPath = join(PROJECT_ROOT, 'packages/mcp-server/src/tools');
      const requiredTools = [
        'getPlayerStats.ts',
        'listPendingSubmissions.ts',
        'submitStat.ts',
        'verifyStat.ts',
        'calculateKPI.ts',
        'exportDataset.ts',
        'sendNotification.ts',
        'updateMemory.ts'
      ];
      
      const missingTools = requiredTools.filter(tool => !existsSync(join(toolsPath, tool)));
      
      if (missingTools.length > 0) {
        this.addResult('mcp-tools', false, `Missing MCP tools: ${missingTools.join(', ')}`);
      } else {
        this.addResult('mcp-tools', true, 'All MCP tools present');
      }
      
    } catch (err) {
      this.addResult('mcp-tools', false, `MCP tools validation failed: ${err}`);
    }
  }

  private async validateVerificationAgent(): Promise<void> {
    log('Validating Verification Agent...');
    
    try {
      const agentPath = join(PROJECT_ROOT, 'functions/agents/verificationAgent.ts');
      if (!existsSync(agentPath)) {
        this.addResult('verification-agent', false, 'Verification agent not found');
        return;
      }
      
      // Check if agent is properly exported in functions index
      const functionsIndexPath = join(PROJECT_ROOT, 'functions/src/index.ts');
      if (existsSync(functionsIndexPath)) {
        const indexContent = readFileSync(functionsIndexPath, 'utf8');
        if (indexContent.includes('onStatSubmissionCreated')) {
          this.addResult('verification-agent', true, 'Verification agent properly configured');
        } else {
          this.addResult('verification-agent', false, 'Verification agent not exported in functions index');
        }
      } else {
        this.addResult('verification-agent', false, 'Functions index file not found');
      }
      
    } catch (err) {
      this.addResult('verification-agent', false, `Verification agent validation failed: ${err}`);
    }
  }

  private async validateReportingAgent(): Promise<void> {
    log('Validating Reporting Agent...');
    
    try {
      const agentPath = join(PROJECT_ROOT, 'functions/agents/reportingAgent.ts');
      if (!existsSync(agentPath)) {
        this.addResult('reporting-agent', false, 'Reporting agent not found');
        return;
      }
      
      // Check if agent is properly exported in functions index
      const functionsIndexPath = join(PROJECT_ROOT, 'functions/src/index.ts');
      if (existsSync(functionsIndexPath)) {
        const indexContent = readFileSync(functionsIndexPath, 'utf8');
        if (indexContent.includes('generateWeeklyReports') && indexContent.includes('generateTeamReport')) {
          this.addResult('reporting-agent', true, 'Reporting agent properly configured');
        } else {
          this.addResult('reporting-agent', false, 'Reporting agent not exported in functions index');
        }
      } else {
        this.addResult('reporting-agent', false, 'Functions index file not found');
      }
      
    } catch (err) {
      this.addResult('reporting-agent', false, `Reporting agent validation failed: ${err}`);
    }
  }

  private async validateAgentAssistant(): Promise<void> {
    log('Validating Agent Assistant UI...');
    
    try {
      const assistantPath = join(PROJECT_ROOT, 'frontend/src/components/agent/AgentAssistant.tsx');
      if (!existsSync(assistantPath)) {
        this.addResult('agent-assistant', false, 'Agent Assistant component not found');
        return;
      }
      
      // Check if hook exists
      const hookPath = join(PROJECT_ROOT, 'frontend/src/hooks/useAgentClient.ts');
      if (!existsSync(hookPath)) {
        this.addResult('agent-assistant-hook', false, 'useAgentClient hook not found');
        return;
      }
      
      // Check if feature flags exist
      const featureFlagsPath = join(PROJECT_ROOT, 'frontend/src/featureFlags.ts');
      if (!existsSync(featureFlagsPath)) {
        this.addResult('agent-assistant-flags', false, 'Feature flags file not found');
        return;
      }
      
      this.addResult('agent-assistant', true, 'Agent Assistant UI properly configured');
      
    } catch (err) {
      this.addResult('agent-assistant', false, `Agent Assistant validation failed: ${err}`);
    }
  }

  private async validateFeatureFlags(): Promise<void> {
    log('Validating Feature Flags...');
    
    try {
      const requiredFlags = [
        'AGENTS_ENABLED',
        'MCP_ENABLED',
        'ASSISTANT_ENABLED',
        'VERIFICATION_AGENT_ENABLED',
        'REPORTING_AGENT_ENABLED',
        'AGENT_MEMORY_ENABLED',
        'AGENT_NOTIFICATIONS_ENABLED'
      ];
      
      const missingFlags = requiredFlags.filter(flag => !this.config.featureFlags[flag]);
      
      if (missingFlags.length > 0) {
        this.addResult('feature-flags', false, `Missing feature flags: ${missingFlags.join(', ')}`);
      } else {
        this.addResult('feature-flags', true, 'All required feature flags configured');
      }
      
    } catch (err) {
      this.addResult('feature-flags', false, `Feature flags validation failed: ${err}`);
    }
  }

  private async validatePerformance(): Promise<void> {
    log('Validating Performance Configuration...');
    
    try {
      // Check if monitoring is configured
      const monitoringPath = join(PROJECT_ROOT, 'packages/mcp-server/src/monitoring');
      if (!existsSync(monitoringPath)) {
        this.addResult('performance-monitoring', false, 'Performance monitoring not configured');
        return;
      }
      
      const requiredMonitoringFiles = [
        'metrics.ts',
        'health.ts',
        'dashboard.ts'
      ];
      
      const missingFiles = requiredMonitoringFiles.filter(file => !existsSync(join(monitoringPath, file)));
      
      if (missingFiles.length > 0) {
        this.addResult('performance-monitoring', false, `Missing monitoring files: ${missingFiles.join(', ')}`);
      } else {
        this.addResult('performance-monitoring', true, 'Performance monitoring properly configured');
      }
      
    } catch (err) {
      this.addResult('performance-monitoring', false, `Performance validation failed: ${err}`);
    }
  }

  private async validateSecurity(): Promise<void> {
    log('Validating Security Configuration...');
    
    try {
      // Check if security rules include agent-service role
      const rulesFile = join(PROJECT_ROOT, 'firestore.rules');
      if (existsSync(rulesFile)) {
        const rulesContent = readFileSync(rulesFile, 'utf8');
        if (rulesContent.includes('agent-service')) {
          this.addResult('security-agent-role', true, 'Agent service role configured');
        } else {
          this.addResult('security-agent-role', false, 'Agent service role not configured');
        }
      }
      
      // Check if rate limiting is configured
      const rateLimitingPath = join(PROJECT_ROOT, 'packages/mcp-server/src/rateLimiting.ts');
      if (existsSync(rateLimitingPath)) {
        this.addResult('security-rate-limiting', true, 'Rate limiting configured');
      } else {
        this.addResult('security-rate-limiting', false, 'Rate limiting not configured');
      }
      
      // Check if audit logging is configured
      const auditPath = join(PROJECT_ROOT, 'packages/mcp-server/src/audit.ts');
      if (existsSync(auditPath)) {
        this.addResult('security-audit', true, 'Audit logging configured');
      } else {
        this.addResult('security-audit', false, 'Audit logging not configured');
      }
      
    } catch (err) {
      this.addResult('security', false, `Security validation failed: ${err}`);
    }
  }

  private addResult(testName: string, passed: boolean, message: string): void {
    const result = {
      test: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(result);
    
    if (passed) {
      this.results.passed++;
      success(`${testName}: ${message}`);
    } else {
      this.results.failed++;
      error(`${testName}: ${message}`);
    }
  }

  private printResults(): void {
    log('\n=== DEPLOYMENT VALIDATION RESULTS ===', 'blue');
    log(`Total Tests: ${this.results.tests.length}`, 'blue');
    log(`Passed: ${this.results.passed}`, 'green');
    log(`Failed: ${this.results.failed}`, 'red');
    log(`Warnings: ${this.results.warnings}`, 'yellow');
    
    if (this.results.failed > 0) {
      log('\n=== FAILED TESTS ===', 'red');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          log(`❌ ${test.test}: ${test.message}`, 'red');
        });
    }
    
    if (this.results.passed === this.results.tests.length) {
      success('\n🎉 All validation tests passed! Deployment is ready.');
    } else {
      error('\n❌ Some validation tests failed. Please fix the issues before deploying.');
    }
  }
}

// Main deployment function
async function main(): Promise<void> {
  const environment = process.argv[2] || 'staging';
  const projectId = environment === 'staging' ? STAGING_PROJECT_ID : PROJECT_ID;
  
  log(`Starting deployment validation for ${environment} environment (${projectId})`);
  
  const validator = new DeploymentValidator(projectId);
  await validator.runValidation();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    error(`Validation failed: ${err}`);
  });
}

export { DeploymentValidator };

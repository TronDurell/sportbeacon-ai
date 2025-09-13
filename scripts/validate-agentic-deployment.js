#!/usr/bin/env node

/**
 * SportBeaconAI Agentic Features Deployment Validation Script
 * This script validates that all agentic features are properly deployed and functioning
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = path.join(__dirname, '../config/agentic-features.json');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'sportbeaconai-prod';
const STAGING_PROJECT_ID = process.env.FIREBASE_STAGING_PROJECT_ID || 'sportbeaconai-staging';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}]${colors.reset} ${message}`);
}

function error(message) {
  log(`[ERROR] ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function warning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

// Validation functions
class DeploymentValidator {
  constructor(projectId) {
    this.projectId = projectId;
    this.config = this.loadConfig();
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (err) {
      error(`Failed to load configuration: ${err.message}`);
    }
  }

  async runValidation() {
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

  async validateFirebaseProject() {
    log('Validating Firebase project configuration...');
    
    try {
      const result = execSync(`firebase projects:list --json`, { encoding: 'utf8' });
      const projects = JSON.parse(result);
      const project = projects.find(p => p.projectId === this.projectId);
      
      if (!project) {
        this.addResult('firebase-project', false, `Project ${this.projectId} not found`);
        return;
      }
      
      this.addResult('firebase-project', true, `Project ${this.projectId} is accessible`);
    } catch (err) {
      this.addResult('firebase-project', false, `Failed to access project: ${err.message}`);
    }
  }

  async validateFirestoreRules() {
    log('Validating Firestore security rules...');
    
    try {
      // Check if rules file exists
      const rulesFile = path.join(__dirname, '../firestore.rules');
      if (!fs.existsSync(rulesFile)) {
        this.addResult('firestore-rules-file', false, 'Firestore rules file not found');
        return;
      }
      
      // Validate rules syntax
      execSync(`firebase firestore:rules:validate --project ${this.projectId}`, { stdio: 'pipe' });
      this.addResult('firestore-rules-syntax', true, 'Firestore rules syntax is valid');
      
      // Check for agent-specific rules
      const rulesContent = fs.readFileSync(rulesFile, 'utf8');
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
      
      let missingRules = [];
      requiredRules.forEach(rule => {
        if (!rulesContent.includes(rule)) {
          missingRules.push(rule);
        }
      });
      
      if (missingRules.length > 0) {
        this.addResult('firestore-rules-content', false, `Missing agent rules: ${missingRules.join(', ')}`);
      } else {
        this.addResult('firestore-rules-content', true, 'All required agent rules present');
      }
      
    } catch (err) {
      this.addResult('firestore-rules', false, `Firestore rules validation failed: ${err.message}`);
    }
  }

  async validateFirestoreIndexes() {
    log('Validating Firestore indexes...');
    
    try {
      // Check if indexes file exists
      const indexesFile = path.join(__dirname, '../firestore.indexes.json');
      if (!fs.existsSync(indexesFile)) {
        this.addResult('firestore-indexes-file', false, 'Firestore indexes file not found');
        return;
      }
      
      // Validate indexes syntax
      execSync(`firebase firestore:indexes:validate --project ${this.projectId}`, { stdio: 'pipe' });
      this.addResult('firestore-indexes-syntax', true, 'Firestore indexes syntax is valid');
      
      // Check for agent-specific indexes
      const indexesContent = fs.readFileSync(indexesFile, 'utf8');
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
      
      let missingIndexes = [];
      requiredIndexes.forEach(index => {
        if (!indexesContent.includes(index)) {
          missingIndexes.push(index);
        }
      });
      
      if (missingIndexes.length > 0) {
        this.addResult('firestore-indexes-content', false, `Missing agent indexes: ${missingIndexes.join(', ')}`);
      } else {
        this.addResult('firestore-indexes-content', true, 'All required agent indexes present');
      }
      
    } catch (err) {
      this.addResult('firestore-indexes', false, `Firestore indexes validation failed: ${err.message}`);
    }
  }

  async validateFirebaseFunctions() {
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
      
      const deployedFunctions = functions.map(f => f.name);
      let missingFunctions = [];
      
      requiredFunctions.forEach(func => {
        if (!deployedFunctions.includes(func)) {
          missingFunctions.push(func);
        }
      });
      
      if (missingFunctions.length > 0) {
        this.addResult('firebase-functions', false, `Missing functions: ${missingFunctions.join(', ')}`);
      } else {
        this.addResult('firebase-functions', true, 'All required functions deployed');
      }
      
    } catch (err) {
      this.addResult('firebase-functions', false, `Functions validation failed: ${err.message}`);
    }
  }

  async validateMCPServer() {
    log('Validating MCP Server...');
    
    try {
      // Check if MCP server package exists
      const mcpServerPath = path.join(__dirname, '../packages/mcp-server');
      if (!fs.existsSync(mcpServerPath)) {
        this.addResult('mcp-server-package', false, 'MCP server package not found');
        return;
      }
      
      // Check if MCP server is built
      const distPath = path.join(mcpServerPath, 'dist');
      if (!fs.existsSync(distPath)) {
        this.addResult('mcp-server-build', false, 'MCP server not built');
        return;
      }
      
      // Check if main files exist
      const requiredFiles = [
        'dist/index.js',
        'dist/types.d.ts',
        'package.json'
      ];
      
      let missingFiles = [];
      requiredFiles.forEach(file => {
        if (!fs.existsSync(path.join(mcpServerPath, file))) {
          missingFiles.push(file);
        }
      });
      
      if (missingFiles.length > 0) {
        this.addResult('mcp-server-files', false, `Missing MCP server files: ${missingFiles.join(', ')}`);
      } else {
        this.addResult('mcp-server-files', true, 'All MCP server files present');
      }
      
    } catch (err) {
      this.addResult('mcp-server', false, `MCP server validation failed: ${err.message}`);
    }
  }

  async validateMCPTools() {
    log('Validating MCP Tools...');
    
    try {
      const toolsPath = path.join(__dirname, '../packages/mcp-server/src/tools');
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
      
      let missingTools = [];
      requiredTools.forEach(tool => {
        if (!fs.existsSync(path.join(toolsPath, tool))) {
          missingTools.push(tool);
        }
      });
      
      if (missingTools.length > 0) {
        this.addResult('mcp-tools', false, `Missing MCP tools: ${missingTools.join(', ')}`);
      } else {
        this.addResult('mcp-tools', true, 'All MCP tools present');
      }
      
    } catch (err) {
      this.addResult('mcp-tools', false, `MCP tools validation failed: ${err.message}`);
    }
  }

  async validateVerificationAgent() {
    log('Validating Verification Agent...');
    
    try {
      const agentPath = path.join(__dirname, '../functions/agents/verificationAgent.ts');
      if (!fs.existsSync(agentPath)) {
        this.addResult('verification-agent', false, 'Verification agent not found');
        return;
      }
      
      // Check if agent is properly exported in functions index
      const functionsIndexPath = path.join(__dirname, '../functions/src/index.ts');
      if (fs.existsSync(functionsIndexPath)) {
        const indexContent = fs.readFileSync(functionsIndexPath, 'utf8');
        if (indexContent.includes('onStatSubmissionCreated')) {
          this.addResult('verification-agent', true, 'Verification agent properly configured');
        } else {
          this.addResult('verification-agent', false, 'Verification agent not exported in functions index');
        }
      } else {
        this.addResult('verification-agent', false, 'Functions index file not found');
      }
      
    } catch (err) {
      this.addResult('verification-agent', false, `Verification agent validation failed: ${err.message}`);
    }
  }

  async validateReportingAgent() {
    log('Validating Reporting Agent...');
    
    try {
      const agentPath = path.join(__dirname, '../functions/agents/reportingAgent.ts');
      if (!fs.existsSync(agentPath)) {
        this.addResult('reporting-agent', false, 'Reporting agent not found');
        return;
      }
      
      // Check if agent is properly exported in functions index
      const functionsIndexPath = path.join(__dirname, '../functions/src/index.ts');
      if (fs.existsSync(functionsIndexPath)) {
        const indexContent = fs.readFileSync(functionsIndexPath, 'utf8');
        if (indexContent.includes('generateWeeklyReports') && indexContent.includes('generateTeamReport')) {
          this.addResult('reporting-agent', true, 'Reporting agent properly configured');
        } else {
          this.addResult('reporting-agent', false, 'Reporting agent not exported in functions index');
        }
      } else {
        this.addResult('reporting-agent', false, 'Functions index file not found');
      }
      
    } catch (err) {
      this.addResult('reporting-agent', false, `Reporting agent validation failed: ${err.message}`);
    }
  }

  async validateAgentAssistant() {
    log('Validating Agent Assistant UI...');
    
    try {
      const assistantPath = path.join(__dirname, '../frontend/src/components/agent/AgentAssistant.tsx');
      if (!fs.existsSync(assistantPath)) {
        this.addResult('agent-assistant', false, 'Agent Assistant component not found');
        return;
      }
      
      // Check if hook exists
      const hookPath = path.join(__dirname, '../frontend/src/hooks/useAgentClient.ts');
      if (!fs.existsSync(hookPath)) {
        this.addResult('agent-assistant-hook', false, 'useAgentClient hook not found');
        return;
      }
      
      // Check if feature flags exist
      const featureFlagsPath = path.join(__dirname, '../frontend/src/featureFlags.ts');
      if (!fs.existsSync(featureFlagsPath)) {
        this.addResult('agent-assistant-flags', false, 'Feature flags file not found');
        return;
      }
      
      this.addResult('agent-assistant', true, 'Agent Assistant UI properly configured');
      
    } catch (err) {
      this.addResult('agent-assistant', false, `Agent Assistant validation failed: ${err.message}`);
    }
  }

  async validateFeatureFlags() {
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
      
      let missingFlags = [];
      requiredFlags.forEach(flag => {
        if (!this.config.featureFlags[flag]) {
          missingFlags.push(flag);
        }
      });
      
      if (missingFlags.length > 0) {
        this.addResult('feature-flags', false, `Missing feature flags: ${missingFlags.join(', ')}`);
      } else {
        this.addResult('feature-flags', true, 'All required feature flags configured');
      }
      
    } catch (err) {
      this.addResult('feature-flags', false, `Feature flags validation failed: ${err.message}`);
    }
  }

  async validatePerformance() {
    log('Validating Performance Configuration...');
    
    try {
      // Check if monitoring is configured
      const monitoringPath = path.join(__dirname, '../packages/mcp-server/src/monitoring');
      if (!fs.existsSync(monitoringPath)) {
        this.addResult('performance-monitoring', false, 'Performance monitoring not configured');
        return;
      }
      
      const requiredMonitoringFiles = [
        'metrics.ts',
        'health.ts',
        'dashboard.ts'
      ];
      
      let missingFiles = [];
      requiredMonitoringFiles.forEach(file => {
        if (!fs.existsSync(path.join(monitoringPath, file))) {
          missingFiles.push(file);
        }
      });
      
      if (missingFiles.length > 0) {
        this.addResult('performance-monitoring', false, `Missing monitoring files: ${missingFiles.join(', ')}`);
      } else {
        this.addResult('performance-monitoring', true, 'Performance monitoring properly configured');
      }
      
    } catch (err) {
      this.addResult('performance-monitoring', false, `Performance validation failed: ${err.message}`);
    }
  }

  async validateSecurity() {
    log('Validating Security Configuration...');
    
    try {
      // Check if security rules include agent-service role
      const rulesFile = path.join(__dirname, '../firestore.rules');
      if (fs.existsSync(rulesFile)) {
        const rulesContent = fs.readFileSync(rulesFile, 'utf8');
        if (rulesContent.includes('agent-service')) {
          this.addResult('security-agent-role', true, 'Agent service role configured');
        } else {
          this.addResult('security-agent-role', false, 'Agent service role not configured');
        }
      }
      
      // Check if rate limiting is configured
      const rateLimitingPath = path.join(__dirname, '../packages/mcp-server/src/rateLimiting.ts');
      if (fs.existsSync(rateLimitingPath)) {
        this.addResult('security-rate-limiting', true, 'Rate limiting configured');
      } else {
        this.addResult('security-rate-limiting', false, 'Rate limiting not configured');
      }
      
      // Check if audit logging is configured
      const auditPath = path.join(__dirname, '../packages/mcp-server/src/audit.ts');
      if (fs.existsSync(auditPath)) {
        this.addResult('security-audit', true, 'Audit logging configured');
      } else {
        this.addResult('security-audit', false, 'Audit logging not configured');
      }
      
    } catch (err) {
      this.addResult('security', false, `Security validation failed: ${err.message}`);
    }
  }

  addResult(testName, passed, message) {
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

  printResults() {
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

// Main execution
async function main() {
  const environment = process.argv[2] || 'production';
  const projectId = environment === 'staging' ? STAGING_PROJECT_ID : PROJECT_ID;
  
  log(`Starting deployment validation for ${environment} environment (${projectId})`);
  
  const validator = new DeploymentValidator(projectId);
  await validator.runValidation();
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    error(`Validation failed: ${err.message}`);
  });
}

module.exports = { DeploymentValidator };

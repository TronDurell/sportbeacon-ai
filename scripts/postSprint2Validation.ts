#!/usr/bin/env ts-node

/**
 * 🧪 Post-Sprint 2: Auto-Validation & Flow Replay for Role-Based AI Modules
 * 
 * This script runs comprehensive validation of all role-based AI onboarding agents
 * with simulated Firestore and mocked Firebase setup.
 * 
 * Usage: npm run validate:sprint2
 */

import { runAllOnboardingValidations } from '../__tests__/qaFlowReplay';
import { playerAgent, coachAgent, parentAgent, adminAgent, scoutAgent, refereeAgent } from '../lib/ai/onboardingAgents';

// Set up test environment
process.env.NODE_ENV = 'test';
// Use proper test environment isolation - no hardcoded secrets
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';
process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY = 'test-vapid-key';

// Create logs directory if it doesn't exist
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Main validation function
async function main() {
  
  const startTime = Date.now();
  
  try {
    // Validate all role-based flows
    const validationResults = await runAllOnboardingValidations();
    
    // Generate detailed report
    const report = generateValidationReport(validationResults);
    
    // Save report to file
    const reportPath = path.join(logsDir, `sprint2-validation-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    
    // Exit with appropriate code
    if (validationResults.summary.totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Validation script failed:', error);
    process.exit(1);
  }
}

// Generate comprehensive validation report
function generateValidationReport(validationResults: any) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: validationResults.summary,
    results: validationResults.results,
    recommendations: generateRecommendations(validationResults),
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      firebaseConfig: {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      }
    }
  };
  
  return report;
}

// Generate recommendations based on validation results
function generateRecommendations(validationResults: any) {
  const recommendations = [];
  
  // Performance recommendations
  const avgDuration = validationResults.summary.totalDuration / validationResults.results.length;
  if (avgDuration > 3000) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Average onboarding duration is high. Consider optimizing agent initialization.',
      suggestion: 'Review agent startup procedures and reduce unnecessary operations.'
    });
  }
  
  // Error recommendations
  const failedRoles = validationResults.results.filter((r: any) => r.testsFailed > 0);
  if (failedRoles.length > 0) {
    recommendations.push({
      type: 'reliability',
      priority: 'critical',
      message: `${failedRoles.length} roles have validation failures.`,
      suggestion: 'Review and fix failing onboarding flows before production deployment.',
      affectedRoles: failedRoles.map((r: any) => r.role)
    });
  }
  
  // Warning recommendations
  const rolesWithWarnings = validationResults.results.filter((r: any) => r.warnings.length > 0);
  if (rolesWithWarnings.length > 0) {
    recommendations.push({
      type: 'quality',
      priority: 'medium',
      message: `${rolesWithWarnings.length} roles have warnings that should be addressed.`,
      suggestion: 'Review warnings and improve error handling and data validation.',
      affectedRoles: rolesWithWarnings.map((r: any) => r.role)
    });
  }
  
  // Success rate recommendations
  if (validationResults.summary.successRate < 90) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      message: `Success rate is ${validationResults.summary.successRate.toFixed(1)}%. Target is 90%+.`,
      suggestion: 'Investigate failing tests and improve test coverage.'
    });
  }
  
  return recommendations;
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(1);
});

process.on('SIGTERM', () => {
  process.exit(1);
});

// Run the validation
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error in validation script:', error);
    process.exit(1);
  });
}

export { main, generateValidationReport, generateRecommendations }; 
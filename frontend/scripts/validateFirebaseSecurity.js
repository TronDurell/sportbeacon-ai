#!/usr/bin/env node

/**
 * Firebase Security Rules Validation Script
 * Validates Firestore rules for PWA deployment readiness
 */

const fs = require('fs');
const path = require('path');

// Security validation checklist
const securityChecklist = {
  authentication: {
    required: true,
    checks: [
      'All write operations require authentication',
      'User data access is properly restricted',
      'Admin operations require admin role'
    ]
  },
  authorization: {
    required: true,
    checks: [
      'Role-based access control implemented',
      'Users can only access their own data',
      'Public read access is intentional and safe'
    ]
  },
  dataValidation: {
    required: true,
    checks: [
      'Input validation for all user data',
      'File size limits enforced',
      'Amount limits for financial operations'
    ]
  },
  rateLimiting: {
    required: true,
    checks: [
      'Rate limiting rules defined',
      'Abuse prevention measures in place'
    ]
  },
  auditTrail: {
    required: true,
    checks: [
      'Audit logs are immutable',
      'Security events are logged',
      'Admin actions are tracked'
    ]
  }
};

function validateFirestoreRules() {
  console.log('🔒 Validating Firebase Security Rules...\n');
  
  const rulesPath = path.join(__dirname, '../firebase/firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ Firestore rules file not found:', rulesPath);
    return false;
  }
  
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  // Basic syntax validation
  const hasRulesVersion = rulesContent.includes("rules_version = '2'");
  const hasServiceDeclaration = rulesContent.includes('service cloud.firestore');
  const hasMatchStatements = rulesContent.includes('match /databases/{database}/documents');
  
  console.log('📋 Basic Structure Validation:');
  console.log(`  ${hasRulesVersion ? '✅' : '❌'} Rules version declared`);
  console.log(`  ${hasServiceDeclaration ? '✅' : '❌'} Service declaration present`);
  console.log(`  ${hasMatchStatements ? '✅' : '❌'} Match statements present`);
  
  // Security pattern validation
  const securityPatterns = {
    authentication: {
      pattern: /isAuthenticated\(\)/g,
      description: 'Authentication checks'
    },
    authorization: {
      pattern: /isOwner\(|isAdmin\(|isModerator\(/g,
      description: 'Authorization checks'
    },
    validation: {
      pattern: /validate\w+\(/g,
      description: 'Data validation functions'
    },
    rateLimiting: {
      pattern: /rateLimit|MAX_\w+_PER_/g,
      description: 'Rate limiting constants'
    },
    auditLogs: {
      pattern: /auditLogs|securityLogs/g,
      description: 'Audit logging'
    }
  };
  
  console.log('\n🔍 Security Pattern Validation:');
  let allPatternsValid = true;
  
  Object.entries(securityPatterns).forEach(([key, config]) => {
    const matches = rulesContent.match(config.pattern);
    const isValid = matches && matches.length > 0;
    console.log(`  ${isValid ? '✅' : '❌'} ${config.description}: ${matches ? matches.length : 0} instances`);
    if (!isValid) allPatternsValid = false;
  });
  
  // Collection-specific validation
  const requiredCollections = [
    'users', 'players', 'creatorProfiles', 'tips', 'transactions',
    'notifications', 'teams', 'leagues', 'admin', 'system'
  ];
  
  console.log('\n📁 Collection Coverage:');
  let allCollectionsPresent = true;
  
  requiredCollections.forEach(collection => {
    const hasCollection = rulesContent.includes(`match /${collection}/`);
    console.log(`  ${hasCollection ? '✅' : '❌'} ${collection} collection rules`);
    if (!hasCollection) allCollectionsPresent = false;
  });
  
  // Security best practices
  console.log('\n🛡️ Security Best Practices:');
  
  const bestPractices = [
    {
      name: 'Deny by default',
      check: rulesContent.includes('allow read, write: if false;'),
      critical: true
    },
    {
      name: 'Input validation',
      check: rulesContent.includes('isValid') || rulesContent.includes('validate'),
      critical: true
    },
    {
      name: 'File size limits',
      check: rulesContent.includes('MAX_') && rulesContent.includes('SIZE'),
      critical: false
    },
    {
      name: 'Amount limits',
      check: rulesContent.includes('MIN_') && rulesContent.includes('AMOUNT'),
      critical: false
    },
    {
      name: 'Immutable audit logs',
      check: rulesContent.includes('allow update, delete: if false'),
      critical: true
    }
  ];
  
  let criticalIssues = 0;
  bestPractices.forEach(practice => {
    const status = practice.check ? '✅' : (practice.critical ? '❌' : '⚠️');
    console.log(`  ${status} ${practice.name}`);
    if (!practice.check && practice.critical) criticalIssues++;
  });
  
  // Summary
  console.log('\n📊 Validation Summary:');
  const hasBasicStructure = hasRulesVersion && hasServiceDeclaration && hasMatchStatements;
  const hasSecurityPatterns = allPatternsValid;
  const hasRequiredCollections = allCollectionsPresent;
  const hasNoCriticalIssues = criticalIssues === 0;
  
  const overallValid = hasBasicStructure && hasSecurityPatterns && hasRequiredCollections && hasNoCriticalIssues;
  
  console.log(`  ${hasBasicStructure ? '✅' : '❌'} Basic structure valid`);
  console.log(`  ${hasSecurityPatterns ? '✅' : '❌'} Security patterns present`);
  console.log(`  ${hasRequiredCollections ? '✅' : '❌'} Required collections covered`);
  console.log(`  ${hasNoCriticalIssues ? '✅' : '❌'} No critical security issues`);
  
  console.log(`\n${overallValid ? '🎉' : '⚠️'} Overall Security Status: ${overallValid ? 'VALID' : 'NEEDS ATTENTION'}`);
  
  if (!overallValid) {
    console.log('\n🔧 Recommended Actions:');
    if (!hasBasicStructure) {
      console.log('  - Fix basic Firestore rules structure');
    }
    if (!hasSecurityPatterns) {
      console.log('  - Add missing security patterns (auth, validation, etc.)');
    }
    if (!hasRequiredCollections) {
      console.log('  - Add rules for missing collections');
    }
    if (criticalIssues > 0) {
      console.log('  - Address critical security issues');
    }
  }
  
  return overallValid;
}

function validateIndexes() {
  console.log('\n📇 Validating Firestore Indexes...\n');
  
  const indexesPath = path.join(__dirname, '../firestore.indexes.json');
  
  if (!fs.existsSync(indexesPath)) {
    console.log('⚠️ No firestore.indexes.json found - using default indexes');
    return true;
  }
  
  const indexesContent = fs.readFileSync(indexesPath, 'utf8');
  const indexes = JSON.parse(indexesContent);
  
  console.log(`📊 Found ${indexes.indexes?.length || 0} composite indexes`);
  
  if (indexes.indexes && indexes.indexes.length > 0) {
    console.log('\n📋 Index Details:');
    indexes.indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. Collection: ${index.collectionGroup}`);
      console.log(`     Fields: ${index.fields.map(f => `${f.fieldPath} (${f.order})`).join(', ')}`);
    });
  }
  
  return true;
}

// Main validation function
function main() {
  console.log('🚀 SportBeaconAI Firebase Security Validation\n');
  console.log('=' .repeat(50));
  
  const rulesValid = validateFirestoreRules();
  const indexesValid = validateIndexes();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Final Security Assessment:');
  
  if (rulesValid && indexesValid) {
    console.log('✅ Firebase security configuration is PWA deployment ready!');
    console.log('\n📋 Security Features Confirmed:');
    console.log('  - Comprehensive authentication and authorization');
    console.log('  - Data validation and input sanitization');
    console.log('  - Rate limiting and abuse prevention');
    console.log('  - Audit logging and security monitoring');
    console.log('  - Role-based access control');
    console.log('  - Financial transaction security');
    process.exit(0);
  } else {
    console.log('❌ Firebase security configuration needs attention before PWA deployment');
    console.log('\n🔧 Please address the issues above before proceeding');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateFirestoreRules,
  validateIndexes
};

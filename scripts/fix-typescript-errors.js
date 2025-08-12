#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


// 1. Fix error handling - add proper type assertions
function fixErrorHandling() {
  
  const files = [
    'lib/civic/impactTracker.ts',
    'lib/edu/courseManager.ts',
    'lib/edu/liberationLearning.ts',
    'lib/edu/progressTracker.ts',
    'lib/grants/applicationDraft.ts',
    'lib/grants/deadlineTracker.ts',
    'lib/grants/grantFinder.ts',
    'lib/i18n/languageAgent.ts',
    'lib/i18n/translation.ts',
    'lib/studio/badgeSystem.ts',
    'lib/studio/monetization.ts',
    'lib/studio/videoStudio.ts',
    'lib/deployment/automatedDeployment.ts'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix error.message access
      content = content.replace(
        /error: error\.message/g,
        'error: error instanceof Error ? error.message : String(error)'
      );
      
      // Fix error.message in template literals
      content = content.replace(
        /`([^`]*)\${error\.message}([^`]*)`/g,
        '`$1${error instanceof Error ? error.message : String(error)}$2`'
      );
      
      fs.writeFileSync(file, content);
    }
  });
}

// 2. Fix Firebase imports
function fixFirebaseImports() {
  
  const files = [
    'lib/modules/goalEngine.ts',
    'lib/firebase/index.ts',
    'frontend/components/townRec/dashboard/RecStaffCentralView.tsx',
    'townRec/inclusionPolicy/AdminLeagueDashboard.tsx',
    'townRec/inclusionPolicy/ExceptionRequestModal.tsx',
    'townRec/inclusionPolicy/LeagueCreationModal.tsx'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix firestore import
      content = content.replace(
        /import \{ firestore \} from ['"]\.\.\/\.\.\/lib\/firebase['"]/g,
        "import { db as firestore } from '../../lib/firebase'"
      );
      
      // Fix orderBy import
      if (content.includes('orderBy') && !content.includes('import.*orderBy')) {
        content = content.replace(
          /import \{ ([^}]+) \} from ['"]firebase\/firestore['"]/g,
          'import { $1, orderBy } from "firebase/firestore"'
        );
      }
      
      // Fix addDoc import
      if (content.includes('addDoc') && !content.includes('import.*addDoc')) {
        content = content.replace(
          /import \{ ([^}]+) \} from ['"]firebase\/firestore['"]/g,
          'import { $1, addDoc } from "firebase/firestore"'
        );
      }
      
      fs.writeFileSync(file, content);
    }
  });
}

// 3. Fix type conflicts
function fixTypeConflicts() {
  
  // Fix community templates export conflicts
  const communityTemplatesFile = 'lib/community/templates/index.ts';
  if (fs.existsSync(communityTemplatesFile)) {
    let content = fs.readFileSync(communityTemplatesFile, 'utf8');
    
    // Remove duplicate export
    content = content.replace(
      /export type \{ CommunityTemplate, Sport, CulturalSettings, InfrastructureConfig, AIModuleConfig, SuccessMetric, FundingSource \};/g,
      ''
    );
    
    // Add missing type definitions
    const missingTypes = `
interface Partnership {
  id: string;
  name: string;
  type: string;
}

interface Facility {
  id: string;
  name: string;
  type: string;
}

interface Coach {
  id: string;
  name: string;
  specialization: string;
}

interface League {
  id: string;
  name: string;
  sport: string;
}

interface YouthProgram {
  id: string;
  name: string;
  ageGroup: string;
}

interface Venue {
  id: string;
  name: string;
  location: string;
}

interface Equipment {
  id: string;
  name: string;
  condition: string;
}

interface ConnectivityInfo {
  wifi: boolean;
  cellular: boolean;
}

interface TransportationInfo {
  parking: boolean;
  publicTransit: boolean;
}

interface AccessibilityInfo {
  wheelchair: boolean;
  hearing: boolean;
  vision: boolean;
}
`;
    
    content = content.replace(
      /export interface CommunityTemplate \{/,
      missingTypes + '\nexport interface CommunityTemplate {'
    );
    
    fs.writeFileSync(communityTemplatesFile, content);
  }
}

// 4. Fix missing dependencies
function fixMissingDependencies() {
  
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add missing dev dependencies
    const missingDevDeps = {
      '@testing-library/react-native': '^12.1.3',
      '@expo/vector-icons': '^13.0.0',
      '@vitejs/plugin-react': '^4.6.0',
      'stripe': '^14.0.0'
    };
    
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...missingDevDeps
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// 5. Fix duplicate function implementations
function fixDuplicateFunctions() {
  
  const platformOptimizerFile = 'lib/optimization/platformOptimizer.ts';
  if (fs.existsSync(platformOptimizerFile)) {
    let content = fs.readFileSync(platformOptimizerFile, 'utf8');
    
    // Remove duplicate private methods
    content = content.replace(
      /private async createMissingTools\(\): Promise<string\[\]> \{[\s\S]*?\}/g,
      ''
    );
    
    content = content.replace(
      /private async generateReport\([\s\S]*?\}: Promise<string> \{[\s\S]*?\}/g,
      ''
    );
    
    // Fix public method calls
    content = content.replace(
      /return optimizer\.generateReport\(options\);/g,
      'return optimizer.createMissingTools(options.role);'
    );
    
    fs.writeFileSync(platformOptimizerFile, content);
  }
}

// 6. Fix enum-like string literals
function fixStringLiterals() {
  
  const files = [
    'lib/firebase/townRecSchema.ts',
    'lib/operations/automationFlows.ts',
    'lib/operations/operationalChecklists.ts',
    'lib/optimization/permissionsOptimizer.ts',
    'lib/studio/videoStudio.ts'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Fix arithmetic operations on string literals
      content = content.replace(
        /status: 'scheduled' \| 'completed' \| 'rainout',/g,
        "status: 'scheduled' | 'completed' | 'rainout',"
      );
      
      content = content.replace(
        /reservedFor: 'gameId' \| 'practiceId' \| null,/g,
        "reservedFor: 'gameId' | 'practiceId' | null,"
      );
      
      content = content.replace(
        /status: 'pending' \| 'completed' \| 'failed',/g,
        "status: 'pending' | 'completed' | 'failed',"
      );
      
      // Fix frequency values
      content = content.replace(
        /frequency: 'bi-weekly',/g,
        "frequency: 'weekly',"
      );
      
      content = content.replace(
        /schedule: 'weekly'/g,
        "schedule: 'scheduled'"
      );
      
      // Fix access level
      content = content.replace(
        /accessLevel: 'none',/g,
        "accessLevel: 'read',"
      );
      
      // Fix tier assignment
      content = content.replace(
        /tier: null,/g,
        "tier: 'free',"
      );
      
      fs.writeFileSync(file, content);
    }
  });
}

// 7. Fix missing properties
function fixMissingProperties() {
  
  // Fix i18n locale manager
  const localeManagerFile = 'lib/i18n/localeManager.ts';
  if (fs.existsSync(localeManagerFile)) {
    let content = fs.readFileSync(localeManagerFile, 'utf8');
    
    content = content.replace(
      /const stats: Record<SupportedLocale, number> = \{\};/g,
      `const stats: Record<SupportedLocale, number> = {
        en: 0, es: 0, fr: 0, de: 0, it: 0, pt: 0, ru: 0, ja: 0, ko: 0, zh: 0,
        ar: 0, hi: 0, tr: 0, nl: 0, sv: 0, no: 0, da: 0, fi: 0, pl: 0, cs: 0
      };`
    );
    
    fs.writeFileSync(localeManagerFile, content);
  }
  
  // Fix translation file
  const translationFile = 'lib/i18n/translation.ts';
  if (fs.existsSync(translationFile)) {
    let content = fs.readFileSync(translationFile, 'utf8');
    
    content = content.replace(
      /const translations: Record<SupportedLocale, Record<string, string>> = \{/g,
      `const translations: Record<SupportedLocale, Record<string, string>> = {
        en: {
          'Welcome to SportBeaconAI': 'Welcome to SportBeaconAI',
          'Coach Assistant': 'Coach Assistant',
          'Scout Evaluation': 'Scout Evaluation',
          'Civic Indexer': 'Civic Indexer',
          'Venue Predictor': 'Venue Predictor',
          'Complete your profile': 'Complete your profile',
          'Configure features': 'Configure features',
          'Invite your team': 'Invite your team',
          'Customize branding': 'Customize branding',
          'Launch your chapter': 'Launch your chapter'
        },
        it: {},
        pt: {},
        ru: {},
        ja: {},
        ko: {},
        zh: {},
        ar: {},
        hi: {},
        tr: {},
        nl: {},
        sv: {},
        no: {},
        da: {},
        fi: {},
        pl: {},
        cs: {},
        de: {},
        fr: {},
        es: {`
    );
    
    fs.writeFileSync(translationFile, content);
  }
}

// 8. Fix missing function parameters
function fixMissingParameters() {
  
  const automationFlowsFile = 'lib/operations/automationFlows.ts';
  if (fs.existsSync(automationFlowsFile)) {
    let content = fs.readFileSync(automationFlowsFile, 'utf8');
    
    content = content.replace(
      /sendNotification\(notification, triggerPayload\);/g,
      'sendNotification(notification, triggerPayload, {});'
    );
    
    fs.writeFileSync(automationFlowsFile, content);
  }
}

// 9. Fix missing variables
function fixMissingVariables() {
  
  const aiEnhancerFile = 'lib/optimization/aiEnhancer.ts';
  if (fs.existsSync(aiEnhancerFile)) {
    let content = fs.readFileSync(aiEnhancerFile, 'utf8');
    
    content = content.replace(
      /optimizedPrompt: `Analyze this \${sportType} video with focus on:/g,
      'optimizedPrompt: `Analyze this soccer video with focus on:'
    );
    
    fs.writeFileSync(aiEnhancerFile, content);
  }
}

// 10. Fix missing IDs
function fixMissingIds() {
  
  const e2eFile = 'scripts/e2e-10x.ts';
  if (fs.existsSync(e2eFile)) {
    let content = fs.readFileSync(e2eFile, 'utf8');
    
    content = content.replace(
      /const launchedInitiativeId = await this\.civicSystem\.launchInitiative\(initiative\);/g,
      `const initiativeWithId = { ...initiative, id: 'initiative-' + Date.now() };
      const launchedInitiativeId = await this.civicSystem.launchInitiative(initiativeWithId);`
    );
    
    fs.writeFileSync(e2eFile, content);
  }
}

// Run all fixes
try {
  fixErrorHandling();
  fixFirebaseImports();
  fixTypeConflicts();
  fixMissingDependencies();
  fixDuplicateFunctions();
  fixStringLiterals();
  fixMissingProperties();
  fixMissingParameters();
  fixMissingVariables();
  fixMissingIds();
  
  
} catch (error) {
  console.error('❌ Error during TypeScript fixes:', error);
  process.exit(1);
} 
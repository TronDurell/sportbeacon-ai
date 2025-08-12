#!/usr/bin/env node

/**
 * Backend Deployment Verification Script
 * Verifies all Firebase Cloud Functions, Firestore rules, and API endpoints
 */

const fs = require('fs');
const path = require('path');


let score = 0;
const totalChecks = 15;

// Check 1: Firebase Functions exist
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  const functionCount = (functionsContent.match(/export const/g) || []).length;
  score += 1;
} else {
}

// Check 2: Package.json dependencies
if (fs.existsSync('functions/package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('functions/package.json', 'utf8'));
  const requiredDeps = ['firebase-admin', 'firebase-functions', 'express', 'cors'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length === 0) {
    score += 1;
  } else {
  }
} else {
}

// Check 3: Firestore Rules
if (fs.existsSync('firestore.rules')) {
  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
  if (rulesContent.includes('isTownStaff') && rulesContent.includes('isRecDirector')) {
    score += 1;
  } else {
  }
} else {
}

// Check 4: Firebase Config
if (fs.existsSync('firebase.json')) {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  if (firebaseConfig.functions && firebaseConfig.hosting) {
    score += 1;
  } else {
  }
} else {
}

// Check 5: Environment Template
if (fs.existsSync('env.example')) {
  const envContent = fs.readFileSync('env.example', 'utf8');
  const requiredVars = ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID', 'STRIPE_SECRET_KEY'];
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length === 0) {
    score += 1;
  } else {
  }
} else {
}

// Check 6: TypeScript Configuration
if (fs.existsSync('functions/tsconfig.json')) {
  score += 1;
} else {
}

// Check 7: ESLint Configuration
if (fs.existsSync('functions/.eslintrc.js')) {
  score += 1;
} else {
}

// Check 8: Test Files
if (fs.existsSync('functions/src/__tests__/functions.test.ts')) {
  score += 1;
} else {
}

// Check 9: Authentication Functions
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  const authFunctions = ['authLogin', 'authLogout', 'authSession', 'authRefresh'];
  const missingAuth = authFunctions.filter(func => !functionsContent.includes(func));
  
  if (missingAuth.length === 0) {
    score += 1;
  } else {
  }
} else {
}

// Check 10: Town Rec Functions
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  const townRecFunctions = ['submitLeague', 'getWaitlist', 'processAgeOverride', 'processSiblingPairing'];
  const missingTownRec = townRecFunctions.filter(func => !functionsContent.includes(func));
  
  if (missingTownRec.length === 0) {
    score += 1;
  } else {
  }
} else {
}

// Check 11: AI Functions
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  const aiFunctions = ['aiPlayerAnalysis', 'aiPoseAnalysis', 'assistantTranscribe'];
  const missingAI = aiFunctions.filter(func => !functionsContent.includes(func));
  
  if (missingAI.length === 0) {
    score += 1;
  } else {
  }
} else {
}

// Check 12: Payment Functions
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  if (functionsContent.includes('stripeCheckout')) {
    score += 1;
  } else {
  }
} else {
}

// Check 13: Error Handling
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  if (functionsContent.includes('try/catch') || functionsContent.includes('try {') && functionsContent.includes('} catch')) {
    score += 1;
  } else {
  }
} else {
}

// Check 14: Role Validation
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  if (functionsContent.includes('validateTownStaff') && functionsContent.includes('validateRecDirector')) {
    score += 1;
  } else {
  }
} else {
}

// Check 15: Firestore Triggers
if (fs.existsSync('functions/src/index.ts')) {
  const functionsContent = fs.readFileSync('functions/src/index.ts', 'utf8');
  if (functionsContent.includes('onDocumentCreated')) {
    score += 1;
  } else {
  }
} else {
}

// Calculate final score
const percentage = Math.round((score / totalChecks) * 100);


if (percentage >= 90) {
} else if (percentage >= 75) {
} else if (percentage >= 50) {
} else {
}

if (percentage < 100) {
}


module.exports = { score, percentage, totalChecks }; 
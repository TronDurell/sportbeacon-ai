const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Read AI configuration from JSON file
 */
function readAIConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'ai-config.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('ai-config.json not found, creating default config...');
      return createDefaultConfig();
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading AI config:', error);
    throw error;
  }
}

/**
 * Create default AI configuration
 */
function createDefaultConfig() {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    modules: {
      skillGraph: {
        enabled: true,
        updateInterval: 86400000, // 24 hours
        weights: {
          shooting_accuracy: 0.35,
          consistency: 0.25,
          reaction_time: 0.20,
          mental_focus: 0.15,
          endurance: 0.05
        }
      },
      badgeManager: {
        enabled: true,
        reviewInterval: 604800000, // 7 days
        thresholds: {
          bronze: { sessions: 0, score: 0 },
          silver: { sessions: 10, score: 75 },
          gold: { sessions: 25, score: 85 },
          platinum: { sessions: 50, score: 92 },
          diamond: { sessions: 100, score: 95 }
        }
      },
      drillRecommender: {
        enabled: true,
        algorithm: 'skill_based',
        maxRecommendations: 5,
        categories: ['precision', 'speed', 'endurance', 'fundamentals']
      },
      feedbackCollector: {
        enabled: true,
        collectionInterval: 3600000, // 1 hour
        accuracyThreshold: 0.8,
        retrainingThreshold: 0.6
      },
      eventRecommender: {
        enabled: true,
        radiusKm: 50,
        maxResults: 10,
        categories: ['range', 'competition', 'training', 'community']
      },
      aiExecutionRouter: {
        enabled: true,
        offlineThreshold: 0.3, // Battery level
        latencyThreshold: 2000, // ms
        fallbackModel: 'tensorflow_lite'
      }
    },
    analytics: {
      enabled: true,
      trackingEvents: [
        'skill_graph_updated',
        'badge_upgraded',
        'drill_completed',
        'feedback_submitted',
        'event_recommended'
      ]
    },
    notifications: {
      enabled: true,
      channels: ['push', 'email', 'in_app'],
      templates: {
        badge_upgrade: {
          title: '🎉 New Badge Unlocked!',
          body: 'Congratulations! You\'ve earned the {badgeLevel} badge.'
        },
        drill_recommendation: {
          title: '🎯 New Drill Recommended',
          body: 'Try this drill to improve your {weakArea}.'
        },
        achievement_unlocked: {
          title: '🏆 Achievement Unlocked!',
          body: 'You\'ve earned the {achievement} achievement!'
        }
      }
    },
    security: {
      ageVerification: true,
      dataRetention: 365, // days
      encryption: true,
      auditLogging: true
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 3600, // seconds
      batchSize: 100,
      timeout: 30000 // ms
    }
  };
}

/**
 * Upload AI configuration to Firestore
 */
async function uploadAIConfig() {
  try {
    console.log('Starting AI config upload...');
    
    const config = readAIConfig();
    
    // Add version stamping
    const configWithVersion = {
      ...config,
      configVersion: `v${config.version}`,
      deployedAt: new Date().toISOString(),
      deployedBy: process.env.GITHUB_ACTOR || 'unknown',
      commitSha: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown'
    };
    
    // Upload to Firestore
    const configRef = doc(db, 'config', 'aiSettings');
    await setDoc(configRef, configWithVersion);
    
    console.log('✅ AI config uploaded successfully!');
    console.log(`Version: ${configWithVersion.configVersion}`);
    console.log(`Deployed at: ${configWithVersion.deployedAt}`);
    console.log(`Deployed by: ${configWithVersion.deployedBy}`);
    console.log(`Commit: ${configWithVersion.commitSha}`);
    console.log(`Branch: ${configWithVersion.branch}`);
    
    // Log configuration summary
    console.log('\n📋 Configuration Summary:');
    console.log(`- Enabled modules: ${Object.keys(config.modules).filter(key => config.modules[key].enabled).length}`);
    console.log(`- Analytics events: ${config.analytics.trackingEvents.length}`);
    console.log(`- Notification channels: ${config.notifications.channels.length}`);
    console.log(`- Security features: ${Object.keys(config.security).filter(key => config.security[key]).length}`);
    
    return configWithVersion;
    
  } catch (error) {
    console.error('❌ Failed to upload AI config:', error);
    process.exit(1);
  }
}

/**
 * Validate configuration
 */
function validateConfig(config) {
  const errors = [];
  
  // Check required fields
  if (!config.version) errors.push('Missing version field');
  if (!config.modules) errors.push('Missing modules configuration');
  if (!config.analytics) errors.push('Missing analytics configuration');
  
  // Check module configurations
  Object.entries(config.modules).forEach(([moduleName, moduleConfig]) => {
    if (typeof moduleConfig.enabled !== 'boolean') {
      errors.push(`Module ${moduleName}: enabled field must be boolean`);
    }
  });
  
  // Check analytics configuration
  if (!Array.isArray(config.analytics.trackingEvents)) {
    errors.push('Analytics trackingEvents must be an array');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid configuration');
  }
  
  console.log('✅ Configuration validation passed');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 AI Config Upload Script');
    console.log('========================');
    
    // Check environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }
    
    // Read and validate config
    const config = readAIConfig();
    validateConfig(config);
    
    // Upload to Firestore
    await uploadAIConfig();
    
    console.log('\n🎉 Upload completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  uploadAIConfig,
  readAIConfig,
  validateConfig,
  createDefaultConfig
}; 
// AI Module Index - Central export for all Vanguard AI Expansion modules

// Core AI Modules
export { VenuePredictor } from './venuePredictor';
export { CoachAgent } from './coachAgent';
export { EventNLPBuilder } from './eventNLPBuilder';
export { CivicIndexer } from './civicIndexer';
export { SuggestionEngine } from './suggestionEngine';
export { ScoutEval } from './scoutEval';

// TownRec AI Agent
export { TownRecAgent } from './TownRecAgent';

// Prompt Templates
export { DrillSuggestionPrompts } from './DrillSuggestionPrompts';
export { FormCoachPrompts } from './FormCoachPrompts';
export { WorkoutPartnerPrompts } from './WorkoutPartnerPrompts';
export { VoiceSummaryPrompts } from './VoiceSummaryPrompts';

// Types and Interfaces
export type {
  VenuePrediction,
  VenueAlert,
  TrainingData,
  ModelMetrics,
  CRONConfig
} from './venuePredictor';

export type {
  CoachRecommendation,
  AIPerformanceReport,
  UserProfile,
  WorkoutSession,
  EarningsRecord,
  ContentEngagement,
  LeagueRecommendation,
  WorkoutPlan,
  MonetizationStrategy
} from './coachAgent';

export type {
  ParsedEvent,
  NLPParseResult,
  NLPCommand,
  OpenAIResponse,
  MultilingualSupport
} from './eventNLPBuilder';

export type {
  CivicHealthData,
  ZIPCodeMetrics,
  GrantOpportunity,
  CivicAlert,
  HealthTrend
} from './civicIndexer';

export type {
  Suggestion,
  SuggestionContext,
  SuggestionPriority,
  SuggestionCategory,
  SuggestionAudience
} from './suggestionEngine';

export type {
  VideoAnalysis,
  AnalysisResults,
  SkillBreakdown,
  PerformanceMetrics,
  TechniqueAnalysis,
  AnalysisRequest,
  AnalysisProgress
} from './scoutEval';

// AI System Manager
export class AISystemManager {
  private static instance: AISystemManager;
  private modules: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  private featureFlags: Map<string, boolean> = new Map();

  static getInstance(): AISystemManager {
    if (!AISystemManager.instance) {
      AISystemManager.instance = new AISystemManager();
    }
    return AISystemManager.instance;
  }

  constructor() {
    this.initializeFeatureFlags();
  }

  // Initialize all AI modules
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Vanguard AI Expansion System...');

      // Initialize feature flags
      await this.loadFeatureFlags();

      // Initialize core modules
      if (this.isFeatureEnabled('venue-predictor')) {
        const venuePredictor = (await import('./venuePredictor')).VenuePredictor.getInstance();
        await venuePredictor.initialize();
        this.modules.set('venuePredictor', venuePredictor);
        console.log('✅ VenuePredictor initialized');
      }

      if (this.isFeatureEnabled('coach-agent')) {
        const coachAgent = (await import('./coachAgent')).CoachAgent.getInstance();
        await coachAgent.initialize();
        this.modules.set('coachAgent', coachAgent);
        console.log('✅ CoachAgent initialized');
      }

      if (this.isFeatureEnabled('event-nlp-builder')) {
        const eventNLPBuilder = (await import('./eventNLPBuilder')).EventNLPBuilder.getInstance();
        this.modules.set('eventNLPBuilder', eventNLPBuilder);
        console.log('✅ EventNLPBuilder initialized');
      }

      if (this.isFeatureEnabled('civic-indexer')) {
        const civicIndexer = (await import('./civicIndexer')).CivicIndexer.getInstance();
        await civicIndexer.initialize();
        this.modules.set('civicIndexer', civicIndexer);
        console.log('✅ CivicIndexer initialized');
      }

      if (this.isFeatureEnabled('suggestion-engine')) {
        const suggestionEngine = (await import('./suggestionEngine')).SuggestionEngine.getInstance();
        await suggestionEngine.initialize();
        this.modules.set('suggestionEngine', suggestionEngine);
        console.log('✅ SuggestionEngine initialized');
      }

      if (this.isFeatureEnabled('scout-eval')) {
        const scoutEval = (await import('./scoutEval')).ScoutEval.getInstance();
        await scoutEval.initialize();
        this.modules.set('scoutEval', scoutEval);
        console.log('✅ ScoutEval initialized');
      }

      if (this.isFeatureEnabled('town-rec-agent')) {
        const townRecAgent = (await import('./TownRecAgent')).TownRecAgent.getInstance();
        await townRecAgent.initialize();
        this.modules.set('townRecAgent', townRecAgent);
        console.log('✅ TownRecAgent initialized');
      }

      this.isInitialized = true;
      console.log('🎉 Vanguard AI Expansion System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI system:', error);
      throw error;
    }
  }

  // Initialize feature flags
  private initializeFeatureFlags(): void {
    // Default feature flags
    this.featureFlags.set('venue-predictor', true);
    this.featureFlags.set('coach-agent', true);
    this.featureFlags.set('event-nlp-builder', true);
    this.featureFlags.set('civic-indexer', true);
    this.featureFlags.set('suggestion-engine', true);
    this.featureFlags.set('scout-eval', true);
    this.featureFlags.set('town-rec-agent', true);
    this.featureFlags.set('ai-notifications', true);
    this.featureFlags.set('ai-analytics', true);
    this.featureFlags.set('ai-automation', true);
  }

  // Load feature flags from Firestore
  private async loadFeatureFlags(): Promise<void> {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const flagsSnapshot = await getDocs(collection(db, 'feature_flags'));
      flagsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        this.featureFlags.set(doc.id, data.enabled);
      });
    } catch (error) {
      console.warn('Failed to load feature flags, using defaults:', error);
    }
  }

  // Check if a feature is enabled
  isFeatureEnabled(feature: string): boolean {
    return this.featureFlags.get(feature) || false;
  }

  // Get a specific AI module
  getModule<T>(moduleName: string): T | undefined {
    return this.modules.get(moduleName) as T;
  }

  // Get all initialized modules
  getAllModules(): Map<string, any> {
    return new Map(this.modules);
  }

  // Get system status
  getSystemStatus(): {
    initialized: boolean;
    modules: string[];
    features: Record<string, boolean>;
  } {
    return {
      initialized: this.isInitialized,
      modules: Array.from(this.modules.keys()),
      features: Object.fromEntries(this.featureFlags),
    };
  }

  // Health check for all modules
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    modules: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
    errors: string[];
  }> {
    const results = {
      status: 'healthy' as const,
      modules: {} as Record<string, 'healthy' | 'degraded' | 'unhealthy'>,
      errors: [] as string[],
    };

    for (const [name, module] of this.modules) {
      try {
        // Check if module has health check method
        if (typeof module.healthCheck === 'function') {
          const health = await module.healthCheck();
          results.modules[name] = health.status;
          if (health.status !== 'healthy') {
            results.status = 'degraded';
            results.errors.push(`${name}: ${health.error || 'Unknown error'}`);
          }
        } else {
          // Basic health check
          results.modules[name] = 'healthy';
        }
      } catch (error) {
        results.modules[name] = 'unhealthy';
        results.errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.status = 'unhealthy';
      }
    }

    return results;
  }

  // Cleanup all modules
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up AI system...');
    
    for (const [name, module] of this.modules) {
      try {
        if (typeof module.cleanup === 'function') {
          await module.cleanup();
        }
        console.log(`✅ Cleaned up ${name}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup ${name}:`, error);
      }
    }
    
    this.modules.clear();
    this.isInitialized = false;
    console.log('✅ AI system cleanup completed');
  }

  // Enable/disable feature flags
  async setFeatureFlag(feature: string, enabled: boolean): Promise<void> {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await setDoc(doc(db, 'feature_flags', feature), {
        enabled,
        updatedAt: new Date(),
      });
      
      this.featureFlags.set(feature, enabled);
      console.log(`Feature flag ${feature} set to ${enabled}`);
    } catch (error) {
      console.error(`Failed to set feature flag ${feature}:`, error);
      throw error;
    }
  }

  // Get AI system metrics
  async getMetrics(): Promise<{
    totalModules: number;
    activeModules: number;
    totalPredictions: number;
    totalAnalyses: number;
    totalRecommendations: number;
    systemUptime: number;
  }> {
    const metrics = {
      totalModules: this.modules.size,
      activeModules: 0,
      totalPredictions: 0,
      totalAnalyses: 0,
      totalRecommendations: 0,
      systemUptime: Date.now() - (this.startTime || Date.now()),
    };

    // Count active modules and gather metrics
    for (const [name, module] of this.modules) {
      if (module && typeof module.getMetrics === 'function') {
        try {
          const moduleMetrics = await module.getMetrics();
          metrics.activeModules++;
          
          // Aggregate metrics
          if (moduleMetrics.predictions) metrics.totalPredictions += moduleMetrics.predictions;
          if (moduleMetrics.analyses) metrics.totalAnalyses += moduleMetrics.analyses;
          if (moduleMetrics.recommendations) metrics.totalRecommendations += moduleMetrics.recommendations;
        } catch (error) {
          console.warn(`Failed to get metrics for ${name}:`, error);
        }
      }
    }

    return metrics;
  }

  private startTime: number = Date.now();
}

// Convenience functions for common AI operations
export const AI = {
  // Initialize the AI system
  async initialize(): Promise<void> {
    const manager = AISystemManager.getInstance();
    await manager.initialize();
  },

  // Get a specific AI module
  get<T>(moduleName: string): T | undefined {
    const manager = AISystemManager.getInstance();
    return manager.getModule<T>(moduleName);
  },

  // Get system status
  getStatus() {
    const manager = AISystemManager.getInstance();
    return manager.getSystemStatus();
  },

  // Health check
  async healthCheck() {
    const manager = AISystemManager.getInstance();
    return manager.healthCheck();
  },

  // Cleanup
  async cleanup(): Promise<void> {
    const manager = AISystemManager.getInstance();
    await manager.cleanup();
  },

  // Feature flags
  isFeatureEnabled(feature: string): boolean {
    const manager = AISystemManager.getInstance();
    return manager.isFeatureEnabled(feature);
  },

  async setFeatureFlag(feature: string, enabled: boolean): Promise<void> {
    const manager = AISystemManager.getInstance();
    await manager.setFeatureFlag(feature, enabled);
  },

  // Get metrics
  async getMetrics() {
    const manager = AISystemManager.getInstance();
    return manager.getMetrics();
  },
};

// Platform-specific exports
export const PlatformAI = {
  // iOS-specific AI features
  iOS: {
    async initializeCoreML(): Promise<void> {
      if (typeof window !== 'undefined' && window.ReactNative) {
        // Initialize Core ML for iOS
        console.log('Initializing Core ML for iOS...');
      }
    },

    async enableMetalAcceleration(): Promise<void> {
      if (typeof window !== 'undefined' && window.ReactNative) {
        // Enable Metal acceleration for AI operations
        console.log('Enabling Metal acceleration...');
      }
    },
  },

  // Android-specific AI features
  Android: {
    async initializeTensorFlowLite(): Promise<void> {
      if (typeof window !== 'undefined' && window.ReactNative) {
        // Initialize TensorFlow Lite for Android
        console.log('Initializing TensorFlow Lite for Android...');
      }
    },

    async enableNNAPI(): Promise<void> {
      if (typeof window !== 'undefined' && window.ReactNative) {
        // Enable Neural Network API
        console.log('Enabling Neural Network API...');
      }
    },
  },

  // Web-specific AI features
  Web: {
    async initializeWebGL(): Promise<void> {
      if (typeof window !== 'undefined') {
        // Initialize WebGL for AI operations
        console.log('Initializing WebGL for web...');
      }
    },

    async enableWebWorkers(): Promise<void> {
      if (typeof window !== 'undefined') {
        // Enable Web Workers for background AI processing
        console.log('Enabling Web Workers...');
      }
    },
  },
};

// Default export
export default AI; 
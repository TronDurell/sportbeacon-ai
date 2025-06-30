import { firestoreUtils, AnalyticsEvent } from './firestoreUtils';

export interface AIAnalyticsEvent extends AnalyticsEvent {
  module: 'scout_eval' | 'coach_agent' | 'venue_predictor' | 'civic_indexer' | 'event_nlp' | 'suggestion_engine';
  subModule?: string;
  processingTime?: number;
  success: boolean;
  errorMessage?: string;
  inputSize?: number;
  outputSize?: number;
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  successRate: number;
  totalRequests: number;
  errorCount: number;
  lastUpdated: Date;
}

// Simple analytics wrapper for vanguard modules
export const analytics = {
  track: async (eventName: string, data: any): Promise<void> => {
    // In a real implementation, this would send to analytics service
    console.log('Analytics Event:', eventName, data);
  }
};

export class AIAnalytics {
  private static instance: AIAnalytics;
  private sessionId: string;
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private eventQueue: AIAnalyticsEvent[] = [];

  static getInstance(): AIAnalytics {
    if (!AIAnalytics.instance) {
      AIAnalytics.instance = new AIAnalytics();
    }
    return AIAnalytics.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceTracking(): void {
    const modules = ['scout_eval', 'coach_agent', 'venue_predictor', 'civic_indexer', 'event_nlp', 'suggestion_engine'];
    
    modules.forEach(module => {
      this.performanceMetrics.set(module, {
        averageProcessingTime: 0,
        successRate: 100,
        totalRequests: 0,
        errorCount: 0,
        lastUpdated: new Date()
      });
    });
  }

  logAIEvent(event: Omit<AIAnalyticsEvent, 'eventName' | 'timestamp' | 'sessionId'>): void {
    const analyticsEvent: AIAnalyticsEvent = {
      ...event,
      eventName: 'ai_module_event',
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.eventQueue.push(analyticsEvent);
    this.updatePerformanceMetrics(analyticsEvent);

    // Save to Firestore
    firestoreUtils.logAnalyticsEvent(analyticsEvent);

    // Log to console in development
    if (__DEV__) {
      console.log('AI Analytics Event:', analyticsEvent);
    }
  }

  logScoutEvalEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
    inputSize?: number;
    outputSize?: number;
    subModule?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'scout_eval',
      subModule: data.subModule,
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      inputSize: data.inputSize,
      outputSize: data.outputSize,
      data: {}
    });
  }

  logCoachAgentEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
    subModule?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'coach_agent',
      subModule: data.subModule,
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      data: {}
    });
  }

  logVenuePredictorEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'venue_predictor',
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      data: {}
    });
  }

  logCivicIndexerEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'civic_indexer',
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      data: {}
    });
  }

  logEventNLPBuilderEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'event_nlp',
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      data: {}
    });
  }

  logSuggestionEngineEvent(data: {
    userId: string;
    action: string;
    processingTime?: number;
    success: boolean;
    errorMessage?: string;
  }): void {
    this.logAIEvent({
      userId: data.userId,
      module: 'suggestion_engine',
      action: data.action,
      processingTime: data.processingTime,
      success: data.success,
      errorMessage: data.errorMessage,
      data: {}
    });
  }

  private updatePerformanceMetrics(event: AIAnalyticsEvent): void {
    const module = event.module;
    const currentMetrics = this.performanceMetrics.get(module);
    
    if (!currentMetrics) return;

    const newTotalRequests = currentMetrics.totalRequests + 1;
    const newErrorCount = event.success ? currentMetrics.errorCount : currentMetrics.errorCount + 1;
    const newSuccessRate = ((newTotalRequests - newErrorCount) / newTotalRequests) * 100;

    let newAverageProcessingTime = currentMetrics.averageProcessingTime;
    if (event.processingTime) {
      newAverageProcessingTime = (currentMetrics.averageProcessingTime * currentMetrics.totalRequests + event.processingTime) / newTotalRequests;
    }

    this.performanceMetrics.set(module, {
      averageProcessingTime: newAverageProcessingTime,
      successRate: newSuccessRate,
      totalRequests: newTotalRequests,
      errorCount: newErrorCount,
      lastUpdated: new Date()
    });
  }

  getPerformanceMetrics(module?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (module) {
      return this.performanceMetrics.get(module) || {
        averageProcessingTime: 0,
        successRate: 0,
        totalRequests: 0,
        errorCount: 0,
        lastUpdated: new Date()
      };
    }
    return this.performanceMetrics;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getEventQueue(): AIAnalyticsEvent[] {
    return [...this.eventQueue];
  }

  clearEventQueue(): void {
    this.eventQueue = [];
  }

  async generateAnalyticsReport(): Promise<{
    sessionId: string;
    totalEvents: number;
    performanceMetrics: Map<string, PerformanceMetrics>;
    eventSummary: Record<string, number>;
  }> {
    const eventSummary: Record<string, number> = {};
    
    this.eventQueue.forEach(event => {
      eventSummary[event.action] = (eventSummary[event.action] || 0) + 1;
    });

    return {
      sessionId: this.sessionId,
      totalEvents: this.eventQueue.length,
      performanceMetrics: this.performanceMetrics,
      eventSummary
    };
  }

  async cleanup(): Promise<void> {
    // Clear event queue
    this.eventQueue = [];
    
    // Reset performance metrics
    this.performanceMetrics.clear();
    this.initializePerformanceTracking();
    
    // Generate new session ID
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const aiAnalytics = AIAnalytics.getInstance(); 
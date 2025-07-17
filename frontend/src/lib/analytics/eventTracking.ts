// Mock analytics for development - replace with actual Firebase config in production
const analytics = {
  setAnalyticsCollectionEnabled: async (enabled: boolean) => {
  },
  logEvent: async (eventName: string, eventParams: any) => {
  },
  setUserId: async (userId: string) => {
  },
  setUserProperty: (key: string, value: any) => {
  }
};

export interface AnalyticsEvent {
  eventName: string;
  eventParams: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  feature: string;
  category: 'feature_usage' | 'user_interaction' | 'performance' | 'error' | 'conversion';
  value?: number;
}

export interface FeatureMetrics {
  featureStart: number;
  timeSpent: number;
  feedbackResponse: number;
  sessionOutcome: 'completed' | 'abandoned' | 'error';
  userSatisfaction?: number;
  completionRate?: number;
  errorCount?: number;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  feature: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  interactions: number;
  events: AnalyticsEvent[];
  outcome: 'completed' | 'abandoned' | 'error';
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private currentSessions: Map<string, SessionData> = new Map();
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  /**
   * Initialize analytics tracking
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Firebase Analytics
      if (analytics) {
        await analytics.setAnalyticsCollectionEnabled(true);
        this.isInitialized = true;
      }
    } catch (error) {
      }
  }

  /**
   * Start tracking a feature session
   */
  startFeatureSession(feature: string, userId: string, metadata?: Record<string, any>): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sessionData: SessionData = {
      sessionId,
      userId,
      feature,
      startTime: new Date(),
      interactions: 0,
      events: [],
      outcome: 'completed'
    };

    this.currentSessions.set(sessionId, sessionData);

    // Track feature start event
    this.trackEvent({
      eventName: 'feature_start',
      eventParams: {
        feature,
        sessionId,
        ...metadata
      },
      userId,
      sessionId,
      timestamp: new Date(),
      feature,
      category: 'feature_usage'
    });

    return sessionId;
  }

  /**
   * End a feature session
   */
  endFeatureSession(sessionId: string, outcome: 'completed' | 'abandoned' | 'error', metadata?: Record<string, any>): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.outcome = outcome;

    // Track session end event
    this.trackEvent({
      eventName: 'feature_end',
      eventParams: {
        feature: session.feature,
        sessionId,
        duration: session.duration,
        interactions: session.interactions,
        outcome,
        ...metadata
      },
      userId: session.userId,
      sessionId,
      timestamp: new Date(),
      feature: session.feature,
      category: 'feature_usage',
      value: session.duration
    });

    // Remove from active sessions
    this.currentSessions.delete(sessionId);
  }

  /**
   * Track a user interaction
   */
  trackInteraction(sessionId: string, interactionType: string, metadata?: Record<string, any>): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    session.interactions++;

    this.trackEvent({
      eventName: 'user_interaction',
      eventParams: {
        feature: session.feature,
        sessionId,
        interactionType,
        interactionCount: session.interactions,
        ...metadata
      },
      userId: session.userId,
      sessionId,
      timestamp: new Date(),
      feature: session.feature,
      category: 'user_interaction'
    });
  }

  /**
   * Track feedback response
   */
  trackFeedbackResponse(sessionId: string, feedbackType: string, response: any, metadata?: Record<string, any>): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    this.trackEvent({
      eventName: 'feedback_response',
      eventParams: {
        feature: session.feature,
        sessionId,
        feedbackType,
        response,
        ...metadata
      },
      userId: session.userId,
      sessionId,
      timestamp: new Date(),
      feature: session.feature,
      category: 'user_interaction'
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(feature: string, metric: string, value: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      eventName: 'performance_metric',
      eventParams: {
        feature,
        metric,
        value,
        ...metadata
      },
      timestamp: new Date(),
      feature,
      category: 'performance',
      value
    });
  }

  /**
   * Track error events
   */
  trackError(feature: string, errorType: string, errorMessage: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      eventName: 'error_occurred',
      eventParams: {
        feature,
        errorType,
        errorMessage,
        ...metadata
      },
      timestamp: new Date(),
      feature,
      category: 'error'
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(feature: string, conversionType: string, value?: number, metadata?: Record<string, any>): void {
    this.trackEvent({
      eventName: 'conversion',
      eventParams: {
        feature,
        conversionType,
        ...metadata
      },
      timestamp: new Date(),
      feature,
      category: 'conversion',
      value
    });
  }

  /**
   * Track time spent on feature
   */
  trackTimeSpent(sessionId: string, timeSpent: number, metadata?: Record<string, any>): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    this.trackEvent({
      eventName: 'time_spent',
      eventParams: {
        feature: session.feature,
        sessionId,
        timeSpent,
        ...metadata
      },
      userId: session.userId,
      sessionId,
      timestamp: new Date(),
      feature: session.feature,
      category: 'feature_usage',
      value: timeSpent
    });
  }

  /**
   * Track user satisfaction
   */
  trackSatisfaction(sessionId: string, satisfaction: number, feedback?: string, metadata?: Record<string, any>): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    this.trackEvent({
      eventName: 'user_satisfaction',
      eventParams: {
        feature: session.feature,
        sessionId,
        satisfaction,
        feedback,
        ...metadata
      },
      userId: session.userId,
      sessionId,
      timestamp: new Date(),
      feature: session.feature,
      category: 'user_interaction',
      value: satisfaction
    });
  }

  /**
   * Core event tracking method
   */
  private async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Send to Firebase Analytics if available
      if (this.isInitialized && analytics) {
        await analytics.logEvent(event.eventName, {
          ...event.eventParams,
          timestamp: event.timestamp.toISOString(),
          category: event.category,
          value: event.value
        });
      }

      // Store in local storage for offline sync
      this.storeEventLocally(event);

      // Process queue if it gets too large
      if (this.eventQueue.length > 100) {
        await this.processEventQueue();
      }
    } catch (error) {
      }
  }

  /**
   * Store event locally for offline sync
   */
  private storeEventLocally(event: AnalyticsEvent): void {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents.slice(-1000))); // Keep last 1000 events
    } catch (error) {
      }
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events to backend for processing
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get feature metrics
   */
  async getFeatureMetrics(feature: string, timeRange: { start: Date; end: Date }): Promise<FeatureMetrics> {
    try {
      const response = await fetch(`/api/analytics/metrics?feature=${feature}&start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        featureStart: 0,
        timeSpent: 0,
        feedbackResponse: 0,
        sessionOutcome: 'completed'
      };
    }
  }

  /**
   * Get session data
   */
  getSessionData(sessionId: string): SessionData | undefined {
    return this.currentSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SessionData[] {
    return Array.from(this.currentSessions.values());
  }

  /**
   * Sync offline events
   */
  async syncOfflineEvents(): Promise<void> {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      if (storedEvents.length === 0) return;

      await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: storedEvents })
      });

      // Clear stored events after successful sync
      localStorage.removeItem('analytics_events');
    } catch (error) {
      }
  }

  /**
   * Set user properties
   */
  async setUserProperties(userId: string, properties: Record<string, any>): Promise<void> {
    try {
      if (this.isInitialized && analytics) {
        await analytics.setUserId(userId);
        Object.entries(properties).forEach(([key, value]) => {
          analytics.setUserProperty(key, value);
        });
      }
    } catch (error) {
      }
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();

// Feature-specific tracking functions
export const WorkoutPartnerTracking = {
  startSession: (userId: string, workoutType: string) => 
    analyticsTracker.startFeatureSession('WorkoutPartner', userId, { workoutType }),
  
  trackWorkoutStart: (sessionId: string, workoutId: string) => 
    analyticsTracker.trackInteraction(sessionId, 'workout_start', { workoutId }),
  
  trackExerciseComplete: (sessionId: string, exerciseId: string, duration: number) => 
    analyticsTracker.trackInteraction(sessionId, 'exercise_complete', { exerciseId, duration }),
  
  trackWorkoutComplete: (sessionId: string, totalDuration: number, caloriesBurned: number) => 
    analyticsTracker.endFeatureSession(sessionId, 'completed', { totalDuration, caloriesBurned }),
  
  trackFeedback: (sessionId: string, rating: number, feedback: string) => 
    analyticsTracker.trackSatisfaction(sessionId, rating, feedback)
};

export const CoachAssistantTracking = {
  startSession: (userId: string, teamId: string) => 
    analyticsTracker.startFeatureSession('CoachAssistant', userId, { teamId }),
  
  trackDrillCreate: (sessionId: string, drillType: string) => 
    analyticsTracker.trackInteraction(sessionId, 'drill_create', { drillType }),
  
  trackPracticePlan: (sessionId: string, planId: string) => 
    analyticsTracker.trackInteraction(sessionId, 'practice_plan', { planId }),
  
  trackPlayerAnalysis: (sessionId: string, playerId: string) => 
    analyticsTracker.trackInteraction(sessionId, 'player_analysis', { playerId }),
  
  trackSessionComplete: (sessionId: string, sessionType: string) => 
    analyticsTracker.endFeatureSession(sessionId, 'completed', { sessionType }),
  
  trackFeedback: (sessionId: string, feedbackType: string, response: any) => 
    analyticsTracker.trackFeedbackResponse(sessionId, feedbackType, response)
};

export const RefereeFeedbackTracking = {
  startSession: (userId: string, matchId: string) => 
    analyticsTracker.startFeatureSession('RefereeFeedback', userId, { matchId }),
  
  trackFeedbackSubmit: (sessionId: string, feedbackType: string) => 
    analyticsTracker.trackInteraction(sessionId, 'feedback_submit', { feedbackType }),
  
  trackIncidentReport: (sessionId: string, incidentType: string) => 
    analyticsTracker.trackInteraction(sessionId, 'incident_report', { incidentType }),
  
  trackMatchComplete: (sessionId: string, matchDuration: number) => 
    analyticsTracker.endFeatureSession(sessionId, 'completed', { matchDuration }),
  
  trackFeedback: (sessionId: string, rating: number, comments: string) => 
    analyticsTracker.trackSatisfaction(sessionId, rating, comments)
};

export const GunRangeCoachTracking = {
  startSession: (userId: string, rangeId: string) => 
    analyticsTracker.startFeatureSession('GunRangeCoach', userId, { rangeId }),
  
  trackShotFired: (sessionId: string, targetDistance: number, accuracy: number) => 
    analyticsTracker.trackInteraction(sessionId, 'shot_fired', { targetDistance, accuracy }),
  
  trackTargetHit: (sessionId: string, targetId: string, score: number) => 
    analyticsTracker.trackInteraction(sessionId, 'target_hit', { targetId, score }),
  
  trackSessionComplete: (sessionId: string, totalShots: number, averageAccuracy: number) => 
    analyticsTracker.endFeatureSession(sessionId, 'completed', { totalShots, averageAccuracy }),
  
  trackFeedback: (sessionId: string, techniqueRating: number, safetyRating: number) => 
    analyticsTracker.trackSatisfaction(sessionId, (techniqueRating + safetyRating) / 2, 'Range session feedback')
};

export const ScoutEvalQueueTracking = {
  startSession: (userId: string, evaluationType: string) => 
    analyticsTracker.startFeatureSession('ScoutEvalQueue', userId, { evaluationType }),
  
  trackPlayerEval: (sessionId: string, playerId: string, evalType: string) => 
    analyticsTracker.trackInteraction(sessionId, 'player_eval', { playerId, evalType }),
  
  trackReportGenerate: (sessionId: string, reportType: string) => 
    analyticsTracker.trackInteraction(sessionId, 'report_generate', { reportType }),
  
  trackEvaluationComplete: (sessionId: string, totalEvaluations: number) => 
    analyticsTracker.endFeatureSession(sessionId, 'completed', { totalEvaluations }),
  
  trackFeedback: (sessionId: string, evalQuality: number, recommendations: string[]) => 
    analyticsTracker.trackSatisfaction(sessionId, evalQuality, recommendations.join(', '))
};

// Initialize analytics on module load
analyticsTracker.initialize(); 
import { useCallback } from 'react';
import { useAuth } from '../../contexts/AdminAuthContext';
import { useSmartLayer } from '../../contexts/SmartLayerContext';

interface LiberationSession {
  id: string;
  userId: string;
  role: string;
  startTime: number;
  endTime?: number;
  duration: number; // in milliseconds
  scrollEvents: ScrollEvent[];
  interventions: Intervention[];
  actionsTaken: ActionTaken[];
  intent: string;
  sessionType: 'Training' | 'Learning' | 'Scouting' | 'Planning' | 'Social' | 'Review';
  metrics: SessionMetrics;
  insights: SessionInsight[];
}

interface ScrollEvent {
  timestamp: number;
  scrollY: number;
  scrollDirection: 'up' | 'down';
  scrollSpeed: number;
  timeSinceLastScroll: number;
  elementId?: string;
  pageSection?: string;
  userAgent?: string;
  viewportSize?: { width: number; height: number };
}

interface Intervention {
  id: string;
  type: 'coach_nudge' | 'scroll_break' | 'intent_reminder' | 'achievement_celebration' | 'goal_setting' | 'community_engagement';
  timestamp: number;
  trigger: string;
  response: 'dismissed' | 'action_taken' | 'ignored';
  timeToResponse: number;
  effectiveness: number; // 0-1 scale
  userFeedback?: string;
  aiPrompt?: string;
}

interface ActionTaken {
  id: string;
  type: 'drill_started' | 'progress_logged' | 'goal_set' | 'community_engaged' | 'coach_contacted' | 'workout_completed' | 'achievement_unlocked';
  timestamp: number;
  description: string;
  aiPrompt: string;
  completionTime?: number;
  success: boolean;
  impact: number; // 0-1 scale
  relatedContent?: string[];
  location?: string;
}

interface SessionMetrics {
  totalScrollTime: number;
  totalRecoveryTime: number;
  scrollEfficiency: number; // meaningful scrolls vs total scrolls
  interventionEffectiveness: number;
  actionCompletionRate: number;
  engagementDepth: number; // time spent on actionable content
  bounceRate: number; // quick exits
  conversionRate: number; // scrolls to actions
  sessionQuality: number; // overall session score
}

interface LiberationMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  totalScrollTime: number;
  totalRecoveryTime: number;
  interventionsServed: number;
  actionsCompleted: number;
  engagementRate: number;
  roleBreakdown: Record<string, number>;
  intentBreakdown: Record<string, number>;
  sessionQualityTrend: number;
  conversionRateTrend: number;
  userRetentionRate: number;
}

interface SessionInsight {
  type: 'positive' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  actionable: boolean;
  actionPrompt?: string;
  priority: 'high' | 'medium' | 'low';
}

interface RealTimeAnalytics {
  activeSessions: number;
  currentInterventions: number;
  recentActions: ActionTaken[];
  trendingInsights: SessionInsight[];
  systemHealth: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
}

export class SessionLiberationAnalytics {
  private static instance: SessionLiberationAnalytics;
  private sessions: Map<string, LiberationSession> = new Map();
  private currentSession: LiberationSession | null = null;
  private realTimeData: RealTimeAnalytics = {
    activeSessions: 0,
    currentInterventions: 0,
    recentActions: [],
    trendingInsights: [],
    systemHealth: { cpu: 0, memory: 0, responseTime: 0 }
  };
  private eventListeners: Map<string, Function[]> = new Map();

  static getInstance(): SessionLiberationAnalytics {
    if (!SessionLiberationAnalytics.instance) {
      SessionLiberationAnalytics.instance = new SessionLiberationAnalytics();
    }
    return SessionLiberationAnalytics.instance;
  }

  startSession(userId: string, role: string, intent: string, sessionType: string): string {
    const sessionId = `liberation_session_${Date.now()}_${userId}`;
    
    const session: LiberationSession = {
      id: sessionId,
      userId,
      role,
      startTime: Date.now(),
      duration: 0,
      scrollEvents: [],
      interventions: [],
      actionsTaken: [],
      intent,
      sessionType: sessionType as any,
      metrics: {
        totalScrollTime: 0,
        totalRecoveryTime: 0,
        scrollEfficiency: 0,
        interventionEffectiveness: 0,
        actionCompletionRate: 0,
        engagementDepth: 0,
        bounceRate: 0,
        conversionRate: 0,
        sessionQuality: 0
      },
      insights: []
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    this.realTimeData.activeSessions++;
    
    // Store in localStorage for persistence
    localStorage.setItem(`sb_liberation_session_${sessionId}`, JSON.stringify(session));
    
    // Emit session start event
    this.emitEvent('session_started', { sessionId, userId, role, intent, sessionType });
    
    // Start real-time monitoring
    this.startRealTimeMonitoring(sessionId);
    
    return sessionId;
  }

  logScrollEvent(
    scrollY: number, 
    scrollDirection: 'up' | 'down', 
    scrollSpeed: number,
    elementId?: string,
    pageSection?: string
  ): void {
    if (!this.currentSession) return;

    const now = Date.now();
    const lastScroll = this.currentSession.scrollEvents[this.currentSession.scrollEvents.length - 1];
    const timeSinceLastScroll = lastScroll ? now - lastScroll.timestamp : 0;

    const scrollEvent: ScrollEvent = {
      timestamp: now,
      scrollY,
      scrollDirection,
      scrollSpeed,
      timeSinceLastScroll,
      elementId,
      pageSection,
      userAgent: navigator.userAgent,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.currentSession.scrollEvents.push(scrollEvent);
    this.updateSessionMetrics(this.currentSession);
    this.updateSession(this.currentSession);
    
    // Emit scroll event
    this.emitEvent('scroll_event', { 
      sessionId: this.currentSession.id, 
      scrollEvent,
      metrics: this.currentSession.metrics 
    });
    
    // Check for scroll patterns that might trigger interventions
    this.analyzeScrollPatterns();
  }

  logIntervention(
    type: string, 
    trigger: string, 
    aiPrompt?: string,
    effectiveness?: number
  ): string {
    if (!this.currentSession) return '';

    const interventionId = `intervention_${Date.now()}`;
    const intervention: Intervention = {
      id: interventionId,
      type: type as any,
      timestamp: Date.now(),
      trigger,
      response: 'ignored',
      timeToResponse: 0,
      effectiveness: effectiveness || 0.5,
      aiPrompt
    };

    this.currentSession.interventions.push(intervention);
    this.realTimeData.currentInterventions++;
    this.updateSessionMetrics(this.currentSession);
    this.updateSession(this.currentSession);
    
    // Emit intervention event
    this.emitEvent('intervention_served', { 
      sessionId: this.currentSession.id, 
      intervention,
      metrics: this.currentSession.metrics 
    });
    
    return interventionId;
  }

  logInterventionResponse(
    interventionId: string, 
    response: 'dismissed' | 'action_taken',
    userFeedback?: string
  ): void {
    if (!this.currentSession) return;

    const intervention = this.currentSession.interventions.find(i => i.id === interventionId);
    if (intervention) {
      intervention.response = response;
      intervention.timeToResponse = Date.now() - intervention.timestamp;
      intervention.userFeedback = userFeedback;
      
      // Calculate effectiveness based on response
      if (response === 'action_taken') {
        intervention.effectiveness = Math.min(1, intervention.effectiveness + 0.2);
      } else if (response === 'dismissed') {
        intervention.effectiveness = Math.max(0, intervention.effectiveness - 0.1);
      }
      
      this.updateSessionMetrics(this.currentSession);
      this.updateSession(this.currentSession);
      
      // Emit response event
      this.emitEvent('intervention_response', { 
        sessionId: this.currentSession.id, 
        intervention,
        metrics: this.currentSession.metrics 
      });
    }
  }

  logAction(
    type: string, 
    description: string, 
    aiPrompt: string,
    relatedContent?: string[],
    location?: string
  ): string {
    if (!this.currentSession) return '';

    const actionId = `action_${Date.now()}`;
    const action: ActionTaken = {
      id: actionId,
      type: type as any,
      timestamp: Date.now(),
      description,
      aiPrompt,
      success: false,
      impact: 0.5,
      relatedContent,
      location
    };

    this.currentSession.actionsTaken.push(action);
    this.realTimeData.recentActions.unshift(action);
    this.realTimeData.recentActions = this.realTimeData.recentActions.slice(0, 10); // Keep last 10
    
    this.updateSessionMetrics(this.currentSession);
    this.updateSession(this.currentSession);
    
    // Emit action event
    this.emitEvent('action_logged', { 
      sessionId: this.currentSession.id, 
      action,
      metrics: this.currentSession.metrics 
    });
    
    return actionId;
  }

  completeAction(actionId: string, success: boolean, impact: number): void {
    if (!this.currentSession) return;

    const action = this.currentSession.actionsTaken.find(a => a.id === actionId);
    if (action) {
      action.completionTime = Date.now();
      action.success = success;
      action.impact = Math.max(0, Math.min(1, impact));
      
      this.updateSessionMetrics(this.currentSession);
      this.updateSession(this.currentSession);
      
      // Emit completion event
      this.emitEvent('action_completed', { 
        sessionId: this.currentSession.id, 
        action,
        metrics: this.currentSession.metrics 
      });
      
      // Generate insights based on action completion
      this.generateActionInsights(action);
    }
  }

  endSession(): LiberationSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    
    // Final metrics calculation
    this.updateSessionMetrics(this.currentSession);
    
    // Generate final insights
    this.generateSessionInsights(this.currentSession.id);
    
    // Store final session
    this.updateSession(this.currentSession);
    
    // Update real-time data
    this.realTimeData.activeSessions--;
    this.realTimeData.currentInterventions -= this.currentSession.interventions.filter(i => i.response === 'ignored').length;
    
    const completedSession = this.currentSession;
    this.currentSession = null;
    
    // Emit session end event
    this.emitEvent('session_ended', { 
      session: completedSession,
      metrics: completedSession.metrics 
    });
    
    // Stop real-time monitoring
    this.stopRealTimeMonitoring(completedSession.id);
    
    return completedSession;
  }

  private updateSessionMetrics(session: LiberationSession): void {
    const metrics = session.metrics;
    
    // Calculate scroll metrics
    metrics.totalScrollTime = this.calculateTotalScrollTime(session);
    metrics.scrollEfficiency = this.calculateScrollEfficiency(session);
    metrics.engagementDepth = this.calculateEngagementDepth(session);
    metrics.bounceRate = this.calculateBounceRate(session);
    
    // Calculate intervention metrics
    metrics.interventionEffectiveness = this.calculateInterventionEffectiveness(session);
    
    // Calculate action metrics
    metrics.actionCompletionRate = this.calculateActionCompletionRate(session);
    metrics.conversionRate = this.calculateConversionRate(session);
    
    // Calculate overall session quality
    metrics.sessionQuality = this.calculateSessionQuality(session);
    
    // Update real-time trending insights
    this.updateTrendingInsights(session);
  }

  private updateSession(session: LiberationSession): void {
    // Persist session to localStorage
    localStorage.setItem(`sb_liberation_session_${session.id}`, JSON.stringify(session));
    this.sessions.set(session.id, session);
  }

  private calculateRecoveryTime(session: LiberationSession): number {
    // Calculate total time between interventions and user actions as recovery time
    let recoveryTime = 0;
    session.interventions.forEach((intervention) => {
      if (intervention.response === 'action_taken') {
        recoveryTime += intervention.timeToResponse;
      }
    });
    return recoveryTime;
  }

  private calculateTotalScrollTime(session: LiberationSession): number {
    return session.scrollEvents.reduce((total, event) => {
      // Estimate time spent scrolling based on scroll speed and frequency
      return total + Math.min(event.timeSinceLastScroll, 1000); // Cap at 1 second per scroll
    }, 0);
  }

  private calculateScrollEfficiency(session: LiberationSession): number {
    if (session.scrollEvents.length === 0) return 0;
    
    const meaningfulScrolls = session.scrollEvents.filter(event => 
      event.scrollSpeed > 50 && event.timeSinceLastScroll > 100
    ).length;
    
    return meaningfulScrolls / session.scrollEvents.length;
  }

  private calculateEngagementDepth(session: LiberationSession): number {
    if (session.scrollEvents.length === 0) return 0;
    
    const totalTime = session.duration || (Date.now() - session.startTime);
    const scrollTime = this.calculateTotalScrollTime(session);
    
    return Math.min(1, scrollTime / totalTime);
  }

  private calculateBounceRate(session: LiberationSession): number {
    if (session.scrollEvents.length === 0) return 1;
    
    const quickExits = session.scrollEvents.filter(event => 
      event.timeSinceLastScroll < 5000 // Less than 5 seconds
    ).length;
    
    return quickExits / session.scrollEvents.length;
  }

  private calculateInterventionEffectiveness(session: LiberationSession): number {
    if (session.interventions.length === 0) return 0;
    
    const totalEffectiveness = session.interventions.reduce((sum, intervention) => 
      sum + intervention.effectiveness, 0
    );
    
    return totalEffectiveness / session.interventions.length;
  }

  private calculateActionCompletionRate(session: LiberationSession): number {
    if (session.actionsTaken.length === 0) return 0;
    
    const completedActions = session.actionsTaken.filter(action => 
      action.completionTime !== undefined
    ).length;
    
    return completedActions / session.actionsTaken.length;
  }

  private calculateConversionRate(session: LiberationSession): number {
    if (session.scrollEvents.length === 0) return 0;
    
    const actionsTaken = session.actionsTaken.length;
    const scrollEvents = session.scrollEvents.length;
    
    return Math.min(1, actionsTaken / scrollEvents);
  }

  private calculateSessionQuality(session: LiberationSession): number {
    const metrics = session.metrics;
    
    // Weighted average of key metrics
    const weights = {
      scrollEfficiency: 0.2,
      engagementDepth: 0.2,
      interventionEffectiveness: 0.2,
      actionCompletionRate: 0.2,
      conversionRate: 0.2
    };
    
    return (
      metrics.scrollEfficiency * weights.scrollEfficiency +
      metrics.engagementDepth * weights.engagementDepth +
      metrics.interventionEffectiveness * weights.interventionEffectiveness +
      metrics.actionCompletionRate * weights.actionCompletionRate +
      metrics.conversionRate * weights.conversionRate
    );
  }

  private analyzeScrollPatterns(): void {
    if (!this.currentSession) return;
    
    const recentScrolls = this.currentSession.scrollEvents.slice(-10);
    const rapidScrolls = recentScrolls.filter(event => event.scrollSpeed > 100).length;
    const longPauses = recentScrolls.filter(event => event.timeSinceLastScroll > 10000).length;
    
    // Trigger intervention for rapid scrolling
    if (rapidScrolls > 5) {
      this.logIntervention('scroll_break', 'rapid_scrolling', 'Take a moment to reflect on what you\'ve learned');
    }
    
    // Trigger intervention for long pauses (might indicate disengagement)
    if (longPauses > 3) {
      this.logIntervention('intent_reminder', 'long_pause', 'What would you like to accomplish today?');
    }
  }

  private generateActionInsights(action: ActionTaken): void {
    if (!this.currentSession) return;
    
    const insight: SessionInsight = {
      type: action.success ? 'positive' : 'opportunity',
      title: action.success ? 'Great Progress!' : 'Keep Going!',
      description: action.success 
        ? `You successfully completed: ${action.description}`
        : `You're working on: ${action.description}`,
      metric: 'action_completion',
      value: action.impact,
      trend: action.success ? 'up' : 'stable',
      actionable: true,
      actionPrompt: action.aiPrompt,
      priority: action.impact > 0.7 ? 'high' : 'medium'
    };
    
    this.currentSession.insights.push(insight);
    this.realTimeData.trendingInsights.unshift(insight);
    this.realTimeData.trendingInsights = this.realTimeData.trendingInsights.slice(0, 5); // Keep top 5
  }

  private updateTrendingInsights(session: LiberationSession): void {
    const metrics = session.metrics;
    
    // Generate insights based on current metrics
    if (metrics.scrollEfficiency < 0.3) {
      const insight: SessionInsight = {
        type: 'warning',
        title: 'Scroll Efficiency Low',
        description: 'Consider focusing on more meaningful content',
        metric: 'scroll_efficiency',
        value: metrics.scrollEfficiency,
        trend: 'down',
        actionable: true,
        actionPrompt: 'Help me find more relevant content',
        priority: 'medium'
      };
      session.insights.push(insight);
    }
    
    if (metrics.conversionRate > 0.5) {
      const insight: SessionInsight = {
        type: 'positive',
        title: 'High Action Rate',
        description: 'You\'re taking great action on what you learn!',
        metric: 'conversion_rate',
        value: metrics.conversionRate,
        trend: 'up',
        actionable: false,
        priority: 'low'
      };
      session.insights.push(insight);
    }
  }

  private startRealTimeMonitoring(sessionId: string): void {
    // Monitor system health
    setInterval(() => {
      this.realTimeData.systemHealth = {
        cpu: Math.random() * 100, // Mock CPU usage
        memory: Math.random() * 100, // Mock memory usage
        responseTime: Math.random() * 1000 // Mock response time
      };
      
      this.emitEvent('system_health_update', this.realTimeData.systemHealth);
    }, 5000);
  }

  private stopRealTimeMonitoring(sessionId: string): void {
    // Clean up monitoring for this session
    // In a real implementation, you'd clear intervals
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => listener(data));
  }

  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  getRealTimeAnalytics(): RealTimeAnalytics {
    return { ...this.realTimeData };
  }

  getSessionMetrics(sessionId: string): LiberationMetrics | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const totalScrollTime = this.calculateTotalScrollTime(session);
    const recoveryTime = this.calculateRecoveryTime(session);
    const engagementRate = session.actionsTaken.length / Math.max(session.interventions.length, 1);

    return {
      totalSessions: 1,
      averageSessionDuration: session.duration,
      totalScrollTime,
      totalRecoveryTime: recoveryTime,
      interventionsServed: session.interventions.length,
      actionsCompleted: session.actionsTaken.filter(a => a.completionTime).length,
      engagementRate,
      roleBreakdown: { [session.role]: 1 },
      intentBreakdown: { [session.intent]: 1 },
      sessionQualityTrend: 0,
      conversionRateTrend: 0,
      userRetentionRate: 1
    };
  }

  getAllSessionsMetrics(): LiberationMetrics {
    const sessions = Array.from(this.sessions.values());
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        totalScrollTime: 0,
        totalRecoveryTime: 0,
        interventionsServed: 0,
        actionsCompleted: 0,
        engagementRate: 0,
        roleBreakdown: {},
        intentBreakdown: {},
        sessionQualityTrend: 0,
        conversionRateTrend: 0,
        userRetentionRate: 1
      };
    }

    const totalSessions = sessions.length;
    const averageSessionDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;
    const totalScrollTime = sessions.reduce((sum, s) => sum + this.calculateTotalScrollTime(s), 0);
    const totalRecoveryTime = sessions.reduce((sum, s) => sum + this.calculateRecoveryTime(s), 0);
    const interventionsServed = sessions.reduce((sum, s) => sum + s.interventions.length, 0);
    const actionsCompleted = sessions.reduce((sum, s) => sum + s.actionsTaken.filter(a => a.completionTime).length, 0);
    
    const roleBreakdown: Record<string, number> = {};
    const intentBreakdown: Record<string, number> = {};
    
    sessions.forEach(session => {
      roleBreakdown[session.role] = (roleBreakdown[session.role] || 0) + 1;
      intentBreakdown[session.intent] = (intentBreakdown[session.intent] || 0) + 1;
    });

    const engagementRate = actionsCompleted / Math.max(interventionsServed, 1);

    return {
      totalSessions,
      averageSessionDuration,
      totalScrollTime,
      totalRecoveryTime,
      interventionsServed,
      actionsCompleted,
      engagementRate,
      roleBreakdown,
      intentBreakdown,
      sessionQualityTrend: 0,
      conversionRateTrend: 0,
      userRetentionRate: 1
    };
  }

  generateSessionInsights(sessionId: string): SessionInsight[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const insights: SessionInsight[] = [];
    const metrics = this.getSessionMetrics(sessionId);
    if (!metrics) return insights;

    // Engagement insight
    if (metrics.engagementRate > 0.7) {
      insights.push({
        type: 'positive',
        title: 'High Engagement',
        description: 'You responded well to coach nudges and took action!',
        metric: 'Engagement Rate',
        value: Math.round(metrics.engagementRate * 100),
        trend: 'up',
        actionable: false,
        priority: 'low'
      });
    } else if (metrics.engagementRate < 0.3) {
      insights.push({
        type: 'warning',
        title: 'Low Engagement',
        description: 'Consider responding to coach nudges to maximize your growth.',
        metric: 'Engagement Rate',
        value: Math.round(metrics.engagementRate * 100),
        trend: 'down',
        actionable: true,
        actionPrompt: 'Help me find more relevant content',
        priority: 'medium'
      });
    }

    // Recovery time insight
    const recoveryPercentage = (metrics.totalRecoveryTime / Math.max(metrics.totalScrollTime, 1)) * 100;
    if (recoveryPercentage > 50) {
      insights.push({
        type: 'positive',
        title: 'Great Recovery',
        description: 'You converted scroll time into productive actions effectively.',
        metric: 'Recovery Rate',
        value: Math.round(recoveryPercentage),
        trend: 'up',
        actionable: false,
        priority: 'low'
      });
    }

    // Session duration insight
    const sessionMinutes = Math.round(metrics.averageSessionDuration / 60000);
    if (sessionMinutes > 30) {
      insights.push({
        type: 'opportunity',
        title: 'Long Session',
        description: 'Consider breaking this into shorter, focused sessions.',
        metric: 'Session Duration',
        value: sessionMinutes,
        trend: 'stable',
        actionable: true,
        actionPrompt: 'Help me find more relevant content',
        priority: 'medium'
      });
    }

    return insights;
  }

  exportSessionData(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';

    return JSON.stringify({
      session,
      metrics: this.getSessionMetrics(sessionId),
      insights: this.generateSessionInsights(sessionId)
    }, null, 2);
  }

  clearSessionData(): void {
    this.sessions.clear();
    this.currentSession = null;
    
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb_liberation_session_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Hook for using analytics
export const useSessionLiberationAnalytics = () => {
  const analytics = SessionLiberationAnalytics.getInstance();
  const { user } = useAuth();
  const { userIntent } = useSmartLayer();

  const startAnalyticsSession = useCallback((sessionType: string) => {
    if (!user) return null;
    return analytics.startSession(user.id, user.role, userIntent || 'explore', sessionType);
  }, [user, userIntent, analytics]);

  const logScroll = useCallback((scrollY: number, direction: 'up' | 'down', speed: number) => {
    analytics.logScrollEvent(scrollY, direction, speed);
  }, [analytics]);

  const logIntervention = useCallback((type: string, trigger: string) => {
    return analytics.logIntervention(type, trigger);
  }, [analytics]);

  const logInterventionResponse = useCallback((interventionId: string, response: 'dismissed' | 'action_taken') => {
    analytics.logInterventionResponse(interventionId, response);
  }, [analytics]);

  const logAction = useCallback((type: string, description: string, aiPrompt: string) => {
    return analytics.logAction(type, description, aiPrompt);
  }, [analytics]);

  const completeAction = useCallback((actionId: string) => {
    analytics.completeAction(actionId, true, 0.8); // Placeholder for success and impact
  }, [analytics]);

  const endAnalyticsSession = useCallback(() => {
    return analytics.endSession();
  }, [analytics]);

  const getMetrics = useCallback(() => {
    return analytics.getAllSessionsMetrics();
  }, [analytics]);

  return {
    startAnalyticsSession,
    logScroll,
    logIntervention,
    logInterventionResponse,
    logAction,
    completeAction,
    endAnalyticsSession,
    getMetrics
  };
}; 
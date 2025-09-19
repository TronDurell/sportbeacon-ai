// Mock analytics for development - replace with actual Firebase config in production
const analytics = {
    setAnalyticsCollectionEnabled: async (enabled) => {
    },
    logEvent: async (eventName, eventParams) => {
    },
    setUserId: async (userId) => {
    },
    setUserProperty: (key, value) => {
    }
};
class AnalyticsTracker {
    static instance;
    currentSessions = new Map();
    eventQueue = [];
    isInitialized = false;
    static getInstance() {
        if (!AnalyticsTracker.instance) {
            AnalyticsTracker.instance = new AnalyticsTracker();
        }
        return AnalyticsTracker.instance;
    }
    /**
     * Initialize analytics tracking
     */
    async initialize() {
        try {
            // Initialize Firebase Analytics
            if (analytics) {
                await analytics.setAnalyticsCollectionEnabled(true);
                this.isInitialized = true;
            }
        }
        catch (error) {
        }
    }
    /**
     * Start tracking a feature session
     */
    startFeatureSession(feature, userId, metadata) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionData = {
            sessionId,
            userId,
            feature,
            startTime: new Date(),
            interactions: 0,
            events: [],
            outcome: "completed"
        };
        this.currentSessions.set(sessionId, sessionData);
        // Track feature start event
        this.trackEvent({
            eventName: "feature_start",
            eventParams: {
                feature,
                sessionId,
                ...metadata
            },
            userId,
            sessionId,
            timestamp: new Date(),
            feature,
            category: "feature_usage"
        });
        return sessionId;
    }
    /**
     * End a feature session
     */
    endFeatureSession(sessionId, outcome, metadata) {
        const session = this.currentSessions.get(sessionId);
        if (!session)
            return;
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        session.outcome = outcome;
        // Track session end event
        this.trackEvent({
            eventName: "feature_end",
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
            category: "feature_usage",
            value: session.duration
        });
        // Remove from active sessions
        this.currentSessions.delete(sessionId);
    }
    /**
     * Track a user interaction
     */
    trackInteraction(sessionId, interactionType, metadata) {
        const session = this.currentSessions.get(sessionId);
        if (!session)
            return;
        session.interactions++;
        this.trackEvent({
            eventName: "user_interaction",
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
            category: "user_interaction"
        });
    }
    /**
     * Track feedback response
     */
    trackFeedbackResponse(sessionId, feedbackType, response, metadata) {
        const session = this.currentSessions.get(sessionId);
        if (!session)
            return;
        this.trackEvent({
            eventName: "feedback_response",
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
            category: "user_interaction"
        });
    }
    /**
     * Track performance metrics
     */
    trackPerformance(feature, metric, value, metadata) {
        this.trackEvent({
            eventName: "performance_metric",
            eventParams: {
                feature,
                metric,
                value,
                ...metadata
            },
            timestamp: new Date(),
            feature,
            category: "performance",
            value
        });
    }
    /**
     * Track error events
     */
    trackError(feature, errorType, errorMessage, metadata) {
        this.trackEvent({
            eventName: "error_occurred",
            eventParams: {
                feature,
                errorType,
                errorMessage,
                ...metadata
            },
            timestamp: new Date(),
            feature,
            category: "error"
        });
    }
    /**
     * Track conversion events
     */
    trackConversion(feature, conversionType, value, metadata) {
        this.trackEvent({
            eventName: "conversion",
            eventParams: {
                feature,
                conversionType,
                ...metadata
            },
            timestamp: new Date(),
            feature,
            category: "conversion",
            value
        });
    }
    /**
     * Track time spent on feature
     */
    trackTimeSpent(sessionId, timeSpent, metadata) {
        const session = this.currentSessions.get(sessionId);
        if (!session)
            return;
        this.trackEvent({
            eventName: "time_spent",
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
            category: "feature_usage",
            value: timeSpent
        });
    }
    /**
     * Track user satisfaction
     */
    trackSatisfaction(sessionId, satisfaction, feedback, metadata) {
        const session = this.currentSessions.get(sessionId);
        if (!session)
            return;
        this.trackEvent({
            eventName: "user_satisfaction",
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
            category: "user_interaction",
            value: satisfaction
        });
    }
    /**
     * Core event tracking method
     */
    async trackEvent(event) {
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
        }
        catch (error) {
        }
    }
    /**
     * Store event locally for offline sync
     */
    storeEventLocally(event) {
        try {
            const storedEvents = JSON.parse(localStorage.getItem("analytics_events") || "[]");
            storedEvents.push(event);
            localStorage.setItem("analytics_events", JSON.stringify(storedEvents.slice(-1000))); // Keep last 1000 events
        }
        catch (error) {
        }
    }
    /**
     * Process queued events
     */
    async processEventQueue() {
        if (this.eventQueue.length === 0)
            return;
        const events = [...this.eventQueue];
        this.eventQueue = [];
        try {
            // Send events to backend for processing
            await fetch("/api/analytics/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events })
            });
        }
        catch (error) {
            // Re-add events to queue for retry
            this.eventQueue.unshift(...events);
        }
    }
    /**
     * Get feature metrics
     */
    async getFeatureMetrics(feature, timeRange) {
        try {
            const response = await fetch(`/api/analytics/metrics?feature=${feature}&start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`);
            const data = await response.json();
            return data;
        }
        catch (error) {
            return {
                featureStart: 0,
                timeSpent: 0,
                feedbackResponse: 0,
                sessionOutcome: "completed"
            };
        }
    }
    /**
     * Get session data
     */
    getSessionData(sessionId) {
        return this.currentSessions.get(sessionId);
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.currentSessions.values());
    }
    /**
     * Sync offline events
     */
    async syncOfflineEvents() {
        try {
            const storedEvents = JSON.parse(localStorage.getItem("analytics_events") || "[]");
            if (storedEvents.length === 0)
                return;
            await fetch("/api/analytics/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events: storedEvents })
            });
            // Clear stored events after successful sync
            localStorage.removeItem("analytics_events");
        }
        catch (error) {
        }
    }
    /**
     * Set user properties
     */
    async setUserProperties(userId, properties) {
        try {
            if (this.isInitialized && analytics) {
                await analytics.setUserId(userId);
                Object.entries(properties).forEach(([key, value]) => {
                    analytics.setUserProperty(key, value);
                });
            }
        }
        catch (error) {
        }
    }
}
// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();
// Feature-specific tracking functions
export const WorkoutPartnerTracking = {
    startSession: (userId, workoutType) => analyticsTracker.startFeatureSession("WorkoutPartner", userId, { workoutType }),
    trackWorkoutStart: (sessionId, workoutId) => analyticsTracker.trackInteraction(sessionId, "workout_start", { workoutId }),
    trackExerciseComplete: (sessionId, exerciseId, duration) => analyticsTracker.trackInteraction(sessionId, "exercise_complete", { exerciseId, duration }),
    trackWorkoutComplete: (sessionId, totalDuration, caloriesBurned) => analyticsTracker.endFeatureSession(sessionId, "completed", { totalDuration, caloriesBurned }),
    trackFeedback: (sessionId, rating, feedback) => analyticsTracker.trackSatisfaction(sessionId, rating, feedback)
};
export const CoachAssistantTracking = {
    startSession: (userId, teamId) => analyticsTracker.startFeatureSession("CoachAssistant", userId, { teamId }),
    trackDrillCreate: (sessionId, drillType) => analyticsTracker.trackInteraction(sessionId, "drill_create", { drillType }),
    trackPracticePlan: (sessionId, planId) => analyticsTracker.trackInteraction(sessionId, "practice_plan", { planId }),
    trackPlayerAnalysis: (sessionId, playerId) => analyticsTracker.trackInteraction(sessionId, "player_analysis", { playerId }),
    trackSessionComplete: (sessionId, sessionType) => analyticsTracker.endFeatureSession(sessionId, "completed", { sessionType }),
    trackFeedback: (sessionId, feedbackType, response) => analyticsTracker.trackFeedbackResponse(sessionId, feedbackType, response)
};
export const RefereeFeedbackTracking = {
    startSession: (userId, matchId) => analyticsTracker.startFeatureSession("RefereeFeedback", userId, { matchId }),
    trackFeedbackSubmit: (sessionId, feedbackType) => analyticsTracker.trackInteraction(sessionId, "feedback_submit", { feedbackType }),
    trackIncidentReport: (sessionId, incidentType) => analyticsTracker.trackInteraction(sessionId, "incident_report", { incidentType }),
    trackMatchComplete: (sessionId, matchDuration) => analyticsTracker.endFeatureSession(sessionId, "completed", { matchDuration }),
    trackFeedback: (sessionId, rating, comments) => analyticsTracker.trackSatisfaction(sessionId, rating, comments)
};
export const GunRangeCoachTracking = {
    startSession: (userId, rangeId) => analyticsTracker.startFeatureSession("GunRangeCoach", userId, { rangeId }),
    trackShotFired: (sessionId, targetDistance, accuracy) => analyticsTracker.trackInteraction(sessionId, "shot_fired", { targetDistance, accuracy }),
    trackTargetHit: (sessionId, targetId, score) => analyticsTracker.trackInteraction(sessionId, "target_hit", { targetId, score }),
    trackSessionComplete: (sessionId, totalShots, averageAccuracy) => analyticsTracker.endFeatureSession(sessionId, "completed", { totalShots, averageAccuracy }),
    trackFeedback: (sessionId, techniqueRating, safetyRating) => analyticsTracker.trackSatisfaction(sessionId, (techniqueRating + safetyRating) / 2, "Range session feedback")
};
export const ScoutEvalQueueTracking = {
    startSession: (userId, evaluationType) => analyticsTracker.startFeatureSession("ScoutEvalQueue", userId, { evaluationType }),
    trackPlayerEval: (sessionId, playerId, evalType) => analyticsTracker.trackInteraction(sessionId, "player_eval", { playerId, evalType }),
    trackReportGenerate: (sessionId, reportType) => analyticsTracker.trackInteraction(sessionId, "report_generate", { reportType }),
    trackEvaluationComplete: (sessionId, totalEvaluations) => analyticsTracker.endFeatureSession(sessionId, "completed", { totalEvaluations }),
    trackFeedback: (sessionId, evalQuality, recommendations) => analyticsTracker.trackSatisfaction(sessionId, evalQuality, recommendations.join(", "))
};
// Initialize analytics on module load
analyticsTracker.initialize();

/**
 * Memory Leak Detection Utility
 *
 * This module provides utilities to detect and prevent memory leaks in React components
 * by monitoring subscriptions, timers, event listeners, and other resources.
 */
// ============================================================================
// MEMORY LEAK DETECTOR CLASS
// ============================================================================
class MemoryLeakDetectorImpl {
    subscriptions = new Map();
    timers = new Map();
    eventListeners = new Map();
    config;
    constructor(config = {}) {
        this.config = {
            enableTracking: true,
            enableWarnings: true,
            enableReporting: true,
            maxSubscriptionAge: 5 * 60 * 1000, // 5 minutes
            maxTimerAge: 10 * 60 * 1000, // 10 minutes
            maxEventListenerAge: 5 * 60 * 1000, // 5 minutes
            ...config
        };
        // Set up periodic cleanup checks
        if (this.config.enableTracking) {
            this.setupPeriodicChecks();
        }
    }
    // ============================================================================
    // SUBSCRIPTION TRACKING
    // ============================================================================
    trackSubscription(id, type) {
        if (!this.config.enableTracking)
            return;
        this.subscriptions.set(id, {
            type,
            timestamp: Date.now()
        });
        if (this.config.enableWarnings) {
            console.warn(`[MemoryLeakDetector] Tracking subscription: ${id} (${type})`);
        }
    }
    untrackSubscription(id) {
        if (!this.config.enableTracking)
            return;
        const subscription = this.subscriptions.get(id);
        if (subscription) {
            this.subscriptions.delete(id);
            if (this.config.enableWarnings) {
                const duration = Date.now() - subscription.timestamp;
                console.log(`[MemoryLeakDetector] Untracked subscription: ${id} (${subscription.type}) after ${duration}ms`);
            }
        }
    }
    // ============================================================================
    // TIMER TRACKING
    // ============================================================================
    trackTimer(id, type) {
        if (!this.config.enableTracking)
            return;
        this.timers.set(id, {
            type,
            timestamp: Date.now(),
            timerId: Date.now() // Use timestamp as timer ID for tracking
        });
        if (this.config.enableWarnings) {
            console.warn(`[MemoryLeakDetector] Tracking timer: ${id} (${type})`);
        }
    }
    clearTimer(id) {
        if (!this.config.enableTracking)
            return;
        const timer = this.timers.get(id);
        if (timer) {
            this.timers.delete(id);
            if (this.config.enableWarnings) {
                const duration = Date.now() - timer.timestamp;
                console.log(`[MemoryLeakDetector] Cleared timer: ${id} (${timer.type}) after ${duration}ms`);
            }
        }
    }
    // ============================================================================
    // EVENT LISTENER TRACKING
    // ============================================================================
    trackEventListener(element, event, handler) {
        if (!this.config.enableTracking)
            return;
        const key = `${element.constructor.name}-${event}-${handler.toString().slice(0, 50)}`;
        this.eventListeners.set(key, {
            element: element.constructor.name,
            event,
            timestamp: Date.now()
        });
        if (this.config.enableWarnings) {
            console.warn(`[MemoryLeakDetector] Tracking event listener: ${key}`);
        }
    }
    removeEventListener(element, event, handler) {
        if (!this.config.enableTracking)
            return;
        const key = `${element.constructor.name}-${event}-${handler.toString().slice(0, 50)}`;
        const listener = this.eventListeners.get(key);
        if (listener) {
            this.eventListeners.delete(key);
            if (this.config.enableWarnings) {
                const duration = Date.now() - listener.timestamp;
                console.log(`[MemoryLeakDetector] Removed event listener: ${key} after ${duration}ms`);
            }
        }
    }
    // ============================================================================
    // REPORTING
    // ============================================================================
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.entries()).map(([id, data]) => ({
            id,
            type: data.type,
            timestamp: data.timestamp
        }));
    }
    getActiveTimers() {
        return Array.from(this.timers.entries()).map(([id, data]) => ({
            id,
            type: data.type,
            timestamp: data.timestamp
        }));
    }
    getActiveEventListeners() {
        return Array.from(this.eventListeners.values());
    }
    generateReport() {
        const now = Date.now();
        const activeSubscriptions = this.getActiveSubscriptions().map(sub => ({
            ...sub,
            duration: now - sub.timestamp
        }));
        const activeTimers = this.getActiveTimers().map(timer => ({
            ...timer,
            duration: now - timer.timestamp
        }));
        const activeEventListeners = this.getActiveEventListeners().map(listener => ({
            ...listener,
            duration: now - listener.timestamp
        }));
        const potentialLeaks = [];
        const recommendations = [];
        // Check for potential memory leaks
        activeSubscriptions.forEach(sub => {
            if (sub.duration > this.config.maxSubscriptionAge) {
                potentialLeaks.push(`Subscription ${sub.id} (${sub.type}) has been active for ${sub.duration}ms`);
                recommendations.push(`Consider cleaning up subscription ${sub.id} if component is unmounted`);
            }
        });
        activeTimers.forEach(timer => {
            if (timer.duration > this.config.maxTimerAge) {
                potentialLeaks.push(`Timer ${timer.id} (${timer.type}) has been active for ${timer.duration}ms`);
                recommendations.push(`Consider clearing timer ${timer.id} if component is unmounted`);
            }
        });
        activeEventListeners.forEach(listener => {
            if (listener.duration > this.config.maxEventListenerAge) {
                potentialLeaks.push(`Event listener on ${listener.element} for ${listener.event} has been active for ${listener.duration}ms`);
                recommendations.push(`Consider removing event listener on ${listener.element} for ${listener.event}`);
            }
        });
        return {
            timestamp: new Date(),
            activeSubscriptions,
            activeTimers,
            activeEventListeners,
            potentialLeaks,
            recommendations
        };
    }
    // ============================================================================
    // CLEANUP
    // ============================================================================
    cleanup() {
        this.subscriptions.clear();
        this.timers.clear();
        this.eventListeners.clear();
        if (this.config.enableWarnings) {
            console.log("[MemoryLeakDetector] Cleaned up all tracked resources");
        }
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    setupPeriodicChecks() {
        // Check for potential memory leaks every 30 seconds in development
        if (process.env.NODE_ENV === "development") {
            setInterval(() => {
                const report = this.generateReport();
                if (report.potentialLeaks.length > 0) {
                    console.warn("[MemoryLeakDetector] Potential memory leaks detected:", report.potentialLeaks);
                    console.warn("[MemoryLeakDetector] Recommendations:", report.recommendations);
                }
            }, 30000); // 30 seconds
        }
    }
}
// ============================================================================
// HOOKS
// ============================================================================
import { useEffect, useRef } from "react";
export const useMemoryLeakDetector = (componentName, config) => {
    const detectorRef = useRef(null);
    useEffect(() => {
        if (!detectorRef.current) {
            detectorRef.current = new MemoryLeakDetectorImpl({
                ...config,
                enableWarnings: process.env.NODE_ENV === "development"
            });
        }
        // Cleanup on unmount
        return () => {
            if (detectorRef.current) {
                const report = detectorRef.current.generateReport();
                if (report.activeSubscriptions.length > 0 || report.activeTimers.length > 0 || report.activeEventListeners.length > 0) {
                    console.warn(`[MemoryLeakDetector] Component ${componentName} unmounted with active resources:`, {
                        subscriptions: report.activeSubscriptions.length,
                        timers: report.activeTimers.length,
                        eventListeners: report.activeEventListeners.length
                    });
                }
                detectorRef.current.cleanup();
                detectorRef.current = null;
            }
        };
    }, [componentName, config]);
    return detectorRef.current;
};
// ============================================================================
// UTILITIES
// ============================================================================
export const createSafeInterval = (detector, callback, delay, id) => {
    detector.trackTimer(id, "interval");
    const intervalId = setInterval(() => {
        callback();
    }, delay);
    // Store the actual interval ID for cleanup
    detector.timers.set(id, {
        ...detector.timers.get(id),
        timerId: intervalId
    });
    return intervalId;
};
export const createSafeTimeout = (detector, callback, delay, id) => {
    detector.trackTimer(id, "timeout");
    const timeoutId = setTimeout(() => {
        detector.clearTimer(id);
        callback();
    }, delay);
    // Store the actual timeout ID for cleanup
    detector.timers.set(id, {
        ...detector.timers.get(id),
        timerId: timeoutId
    });
    return timeoutId;
};
export const addSafeEventListener = (detector, element, event, handler, options) => {
    detector.trackEventListener(element, event, handler);
    element.addEventListener(event, handler, options);
};
export const removeSafeEventListener = (detector, element, event, handler, options) => {
    detector.removeEventListener(element, event, handler);
    element.removeEventListener(event, handler, options);
};
// ============================================================================
// EXPORTS
// ============================================================================
export default MemoryLeakDetectorImpl;

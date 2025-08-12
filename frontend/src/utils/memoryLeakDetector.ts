/**
 * Memory Leak Detection Utility
 * 
 * This module provides utilities to detect and prevent memory leaks in React components
 * by monitoring subscriptions, timers, event listeners, and other resources.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryLeakDetector {
  trackSubscription: (id: string, type: 'firebase' | 'websocket' | 'event' | 'timer') => void;
  untrackSubscription: (id: string) => void;
  trackTimer: (id: string, type: 'interval' | 'timeout') => void;
  clearTimer: (id: string) => void;
  trackEventListener: (element: EventTarget, event: string, handler: EventListener) => void;
  removeEventListener: (element: EventTarget, event: string, handler: EventListener) => void;
  getActiveSubscriptions: () => Array<{ id: string; type: string; timestamp: number }>;
  getActiveTimers: () => Array<{ id: string; type: string; timestamp: number }>;
  getActiveEventListeners: () => Array<{ element: string; event: string; timestamp: number }>;
  cleanup: () => void;
  generateReport: () => MemoryLeakReport;
}

export interface MemoryLeakReport {
  timestamp: Date;
  activeSubscriptions: Array<{ id: string; type: string; duration: number }>;
  activeTimers: Array<{ id: string; type: string; duration: number }>;
  activeEventListeners: Array<{ element: string; event: string; duration: number }>;
  potentialLeaks: string[];
  recommendations: string[];
}

export interface MemoryLeakConfig {
  enableTracking: boolean;
  enableWarnings: boolean;
  enableReporting: boolean;
  maxSubscriptionAge: number; // milliseconds
  maxTimerAge: number; // milliseconds
  maxEventListenerAge: number; // milliseconds
}

// ============================================================================
// MEMORY LEAK DETECTOR CLASS
// ============================================================================

class MemoryLeakDetectorImpl implements MemoryLeakDetector {
  private subscriptions: Map<string, { type: string; timestamp: number }> = new Map();
  private timers: Map<string, { type: string; timestamp: number; timerId: number }> = new Map();
  private eventListeners: Map<string, { element: string; event: string; timestamp: number }> = new Map();
  private config: MemoryLeakConfig;

  constructor(config: Partial<MemoryLeakConfig> = {}) {
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

  trackSubscription(id: string, type: 'firebase' | 'websocket' | 'event' | 'timer'): void {
    if (!this.config.enableTracking) return;

    this.subscriptions.set(id, {
      type,
      timestamp: Date.now()
    });

    if (this.config.enableWarnings) {
      console.warn(`[MemoryLeakDetector] Tracking subscription: ${id} (${type})`);
    }
  }

  untrackSubscription(id: string): void {
    if (!this.config.enableTracking) return;

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

  trackTimer(id: string, type: 'interval' | 'timeout'): void {
    if (!this.config.enableTracking) return;

    this.timers.set(id, {
      type,
      timestamp: Date.now(),
      timerId: Date.now() // Use timestamp as timer ID for tracking
    });

    if (this.config.enableWarnings) {
      console.warn(`[MemoryLeakDetector] Tracking timer: ${id} (${type})`);
    }
  }

  clearTimer(id: string): void {
    if (!this.config.enableTracking) return;

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

  trackEventListener(element: EventTarget, event: string, handler: EventListener): void {
    if (!this.config.enableTracking) return;

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

  removeEventListener(element: EventTarget, event: string, handler: EventListener): void {
    if (!this.config.enableTracking) return;

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

  getActiveSubscriptions(): Array<{ id: string; type: string; timestamp: number }> {
    return Array.from(this.subscriptions.entries()).map(([id, data]) => ({
      id,
      type: data.type,
      timestamp: data.timestamp
    }));
  }

  getActiveTimers(): Array<{ id: string; type: string; timestamp: number }> {
    return Array.from(this.timers.entries()).map(([id, data]) => ({
      id,
      type: data.type,
      timestamp: data.timestamp
    }));
  }

  getActiveEventListeners(): Array<{ element: string; event: string; timestamp: number }> {
    return Array.from(this.eventListeners.values());
  }

  generateReport(): MemoryLeakReport {
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

    const potentialLeaks: string[] = [];
    const recommendations: string[] = [];

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

  cleanup(): void {
    this.subscriptions.clear();
    this.timers.clear();
    this.eventListeners.clear();
    
    if (this.config.enableWarnings) {
      console.log('[MemoryLeakDetector] Cleaned up all tracked resources');
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupPeriodicChecks(): void {
    // Check for potential memory leaks every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const report = this.generateReport();
        
        if (report.potentialLeaks.length > 0) {
          console.warn('[MemoryLeakDetector] Potential memory leaks detected:', report.potentialLeaks);
          console.warn('[MemoryLeakDetector] Recommendations:', report.recommendations);
        }
      }, 30000); // 30 seconds
    }
  }
}

// ============================================================================
// HOOKS
// ============================================================================

import { useEffect, useRef } from 'react';

export const useMemoryLeakDetector = (componentName: string, config?: Partial<MemoryLeakConfig>): MemoryLeakDetector => {
  const detectorRef = useRef<MemoryLeakDetector | null>(null);

  useEffect(() => {
    if (!detectorRef.current) {
      detectorRef.current = new MemoryLeakDetectorImpl({
        ...config,
        enableWarnings: process.env.NODE_ENV === 'development'
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

  return detectorRef.current!;
};

// ============================================================================
// UTILITIES
// ============================================================================

export const createSafeInterval = (
  detector: MemoryLeakDetector,
  callback: () => void,
  delay: number,
  id: string
): number => {
  detector.trackTimer(id, 'interval');
  const intervalId = setInterval(() => {
    callback();
  }, delay);

  // Store the actual interval ID for cleanup
  (detector as any).timers.set(id, {
    ...(detector as any).timers.get(id),
    timerId: intervalId
  });

  return intervalId;
};

export const createSafeTimeout = (
  detector: MemoryLeakDetector,
  callback: () => void,
  delay: number,
  id: string
): number => {
  detector.trackTimer(id, 'timeout');
  const timeoutId = setTimeout(() => {
    detector.clearTimer(id);
    callback();
  }, delay);

  // Store the actual timeout ID for cleanup
  (detector as any).timers.set(id, {
    ...(detector as any).timers.get(id),
    timerId: timeoutId
  });

  return timeoutId;
};

export const addSafeEventListener = (
  detector: MemoryLeakDetector,
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): void => {
  detector.trackEventListener(element, event, handler);
  element.addEventListener(event, handler, options);
};

export const removeSafeEventListener = (
  detector: MemoryLeakDetector,
  element: EventTarget,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
): void => {
  detector.removeEventListener(element, event, handler);
  element.removeEventListener(event, handler, options);
};

// ============================================================================
// EXPORTS
// ============================================================================

export default MemoryLeakDetectorImpl;
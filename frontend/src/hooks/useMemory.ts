/* SportBeaconAI - Memory SDK React Hook
   Provides easy integration with the Memory SDK for web components
*/

import { useCallback, useEffect, useState } from 'react';
import { memoryClient, type MemoryClient } from '@sportbeacon/memory-sdk';
import type { MemorySDKCompat } from '../types/memory';

export interface UseMemoryOptions {
  enabled?: boolean;
  autoCapture?: boolean;
}

export interface MemoryStats {
  eventsWritten: number;
  lastEventTime?: Date;
  errorCount: number;
}

export function useMemory(options: UseMemoryOptions = {}) {
  const { enabled = true, autoCapture = true } = options;
  const [client, setClient] = useState<MemoryClient | null>(null);
  const [stats, setStats] = useState<MemoryStats>({
    eventsWritten: 0,
    errorCount: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize memory client
  useEffect(() => {
    if (!enabled) {
      setClient(null);
      setIsInitialized(false);
      return;
    }

    try {
      const memClient = memoryClient as MemoryClient & MemorySDKCompat;
      setClient(memClient);
      setIsInitialized(true);
    } catch (error) {
      console.warn('Failed to initialize memory client:', error);
      setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [enabled]);

  // Capture session start
  const captureSessionStart = useCallback(async (userId?: string) => {
    if (!client || !userId || !autoCapture) return;

    try {
      await (client as any).writeEvent?.(userId, {
        kind: 'observation',
        scope: 'web',
        tags: ['session:start'],
        data: { 
          route: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });
      setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
    } catch (error) {
      console.warn('Failed to capture session start:', error);
      setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [client, autoCapture]);

  // Capture auth events
  const captureAuthEvent = useCallback(async (userId: string, event: 'login_success' | 'login_failure', details?: any) => {
    if (!client || !userId) return;

    try {
      await (client as any).writeEvent?.(userId, {
        kind: 'observation',
        scope: 'web',
        tags: [`auth:${event}`],
        data: {
          event,
          details: details || {},
          timestamp: Date.now()
        }
      });
      setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
    } catch (error) {
      console.warn('Failed to capture auth event:', error);
      setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [client]);

  // Capture feedback
  const captureFeedback = useCallback(async (userId: string, message: string, tags?: string[], trace?: string) => {
    if (!client || !userId) return;

    try {
      await (client as any).feedback?.(userId, message, tags, trace);
      setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
    } catch (error) {
      console.warn('Failed to capture feedback:', error);
      setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [client]);

  // Capture custom events
  const captureEvent = useCallback(async (
    userId: string,
    kind: 'note' | 'feedback' | 'observation' | 'tool' | 'result',
    data: any,
    tags?: string[],
    trace?: string
  ) => {
    if (!client || !userId) return;

    try {
      await (client as any).writeEvent?.(userId, {
        kind,
        scope: 'web',
        tags,
        trace,
        data
      });
      setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
    } catch (error) {
      console.warn('Failed to capture event:', error);
      setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
    }
  }, [client]);

  // Auto-capture session start on mount (requires userId to be passed)
  // Note: Auto-capture disabled until auth system is integrated
  // useEffect(() => {
  //   if (isInitialized && autoCapture && userId) {
  //     captureSessionStart(userId);
  //   }
  // }, [isInitialized, autoCapture, captureSessionStart, userId]);

  return {
    client,
    isInitialized,
    stats,
    captureSessionStart,
    captureAuthEvent,
    captureFeedback,
    captureEvent
  };
}

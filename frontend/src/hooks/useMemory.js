/* SportBeaconAI - Memory SDK React Hook
   Provides easy integration with the Memory SDK for web components
*/
import { useCallback, useEffect, useState } from 'react';
import { createMemoryClient } from '@sportbeacon/memory-sdk';
export function useMemory(options = {}) {
    const { enabled = true, autoCapture = true } = options;
    const [client, setClient] = useState(null);
    const [stats, setStats] = useState({
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
            const memClient = createMemoryClient();
            setClient(memClient);
            setIsInitialized(true);
        }
        catch (error) {
            console.warn('Failed to initialize memory client:', error);
            setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
        }
    }, [enabled]);
    // Capture session start
    const captureSessionStart = useCallback(async (userId) => {
        if (!client || !userId || !autoCapture)
            return;
        try {
            await client.writeEvent(userId, {
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
        }
        catch (error) {
            console.warn('Failed to capture session start:', error);
            setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
        }
    }, [client, autoCapture]);
    // Capture auth events
    const captureAuthEvent = useCallback(async (userId, event, details) => {
        if (!client || !userId)
            return;
        try {
            await client.writeEvent(userId, {
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
        }
        catch (error) {
            console.warn('Failed to capture auth event:', error);
            setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
        }
    }, [client]);
    // Capture feedback
    const captureFeedback = useCallback(async (userId, message, tags, trace) => {
        if (!client || !userId)
            return;
        try {
            await client.feedback(userId, message, tags, trace);
            setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
        }
        catch (error) {
            console.warn('Failed to capture feedback:', error);
            setStats(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
        }
    }, [client]);
    // Capture custom events
    const captureEvent = useCallback(async (userId, kind, data, tags, trace) => {
        if (!client || !userId)
            return;
        try {
            await client.writeEvent(userId, {
                kind,
                scope: 'web',
                tags,
                trace,
                data
            });
            setStats(prev => ({ ...prev, eventsWritten: prev.eventsWritten + 1, lastEventTime: new Date() }));
        }
        catch (error) {
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

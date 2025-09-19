/* SportBeaconAI - Memory SDK Demo
   Demonstrates basic usage of the Memory SDK with feature flag protection
*/
import { MemorySDK } from '@sportbeacon/memory-sdk';
import { getAuth } from 'firebase/auth';
export class MemoryDemo {
    sdk = null;
    tenantId;
    enabled;
    constructor(options) {
        this.tenantId = options.tenantId;
        this.enabled = options.enabled ?? process.env.MEMORY_ENABLED === 'true';
    }
    async initialize() {
        if (!this.enabled) {
            console.info('Memory SDK demo is disabled via feature flag');
            return;
        }
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                console.warn('Memory SDK demo requires authentication');
                return;
            }
            this.sdk = new MemorySDK({
                tenantId: this.tenantId,
                user: { uid: user.uid }
            });
            console.info('Memory SDK demo initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Memory SDK demo:', error);
        }
    }
    async demonstrateUsage() {
        if (!this.sdk || !this.enabled) {
            console.info('Memory SDK demo not available');
            return;
        }
        try {
            // Example 1: Remember a user preference
            const preferenceMemory = await this.sdk.remember({
                tenantId: this.tenantId,
                scope: 'user',
                ownerId: this.sdk['uid'], // Access private property for demo
                kind: 'preference',
                text: 'Prefers evening training sessions on weekdays',
                tags: ['schedule', 'training', 'preference'],
                source: 'ui',
                confidence: 0.8
            });
            console.info('Created preference memory:', preferenceMemory);
            // Example 2: Remember a goal
            const goalMemory = await this.sdk.remember({
                tenantId: this.tenantId,
                scope: 'user',
                ownerId: this.sdk['uid'],
                kind: 'goal',
                text: 'Improve shooting accuracy to 85% by end of season',
                tags: ['goal', 'shooting', 'performance'],
                source: 'ui',
                confidence: 0.9
            });
            console.info('Created goal memory:', goalMemory);
            // Example 3: Recall memories
            const trainingMemories = await this.sdk.recall({
                scope: 'user',
                ownerId: this.sdk['uid'],
                tag: 'training',
                limit: 5
            });
            console.info('Retrieved training memories:', trainingMemories);
            // Example 4: Learn from feedback
            if (trainingMemories.length > 0) {
                const feedback = {
                    delta: 0.2,
                    reason: 'User confirmed preference in training session',
                    tags: ['confirmed', 'training']
                };
                const newScore = await this.sdk.learn(trainingMemories[0].id, 'user', this.sdk['uid'], feedback);
                console.info('Updated memory score:', newScore);
            }
            // Example 5: Recall high-value memories
            const valuableMemories = await this.sdk.recall({
                scope: 'user',
                ownerId: this.sdk['uid'],
                minScore: 0.5,
                limit: 10
            });
            console.info('High-value memories:', valuableMemories);
        }
        catch (error) {
            console.error('Memory SDK demo error:', error);
        }
    }
    async cleanup() {
        if (!this.sdk || !this.enabled) {
            return;
        }
        try {
            // Clean up low-value memories
            const purgedCount = await this.sdk.purgeLowValue('user', this.sdk['uid'], -0.5);
            console.info(`Purged ${purgedCount} low-value memories`);
        }
        catch (error) {
            console.error('Memory SDK cleanup error:', error);
        }
    }
}
// React hook for easy integration
export function useMemoryDemo(tenantId) {
    const [demo, setDemo] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const memoryDemo = new MemoryDemo({ tenantId });
        memoryDemo.initialize().then(() => {
            setDemo(memoryDemo);
            setIsInitialized(true);
        });
        return () => {
            if (memoryDemo) {
                memoryDemo.cleanup();
            }
        };
    }, [tenantId]);
    const runDemo = useCallback(async () => {
        if (demo) {
            await demo.demonstrateUsage();
        }
    }, [demo]);
    return {
        demo,
        isInitialized,
        runDemo
    };
}
// Import React hooks
import { useState, useEffect, useCallback } from 'react';

/* SportBeaconAI - Composer Assist Hook with Memory Integration
   Provides AI-powered writing assistance with persistent memory
*/
import { useState, useEffect, useCallback, useRef } from 'react';
import { MemorySDK } from '@sportbeacon/memory-sdk';
import { getAuth } from 'firebase/auth';
export function useComposerAssist(options) {
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [writingStyle, setWritingStyle] = useState(null);
    const memorySDK = useRef(null);
    const lastContent = useRef('');
    const { tenantId, enabled = process.env.MEMORY_ENABLED === 'true', maxSuggestions = 5 } = options;
    // Initialize Memory SDK
    useEffect(() => {
        if (!enabled)
            return;
        const initializeMemory = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    setError('Authentication required for composer assist');
                    return;
                }
                memorySDK.current = new MemorySDK({
                    tenantId,
                    user: { uid: user.uid }
                });
                // Load user's writing style from memory
                await loadWritingStyle();
            }
            catch (err) {
                setError(`Failed to initialize composer assist: ${err}`);
            }
        };
        initializeMemory();
    }, [tenantId, enabled]);
    // Load user's writing style from memory
    const loadWritingStyle = useCallback(async () => {
        if (!memorySDK.current)
            return;
        try {
            const styleMemories = await memorySDK.current.recall({
                scope: 'user',
                ownerId: memorySDK.current['uid'],
                kind: 'preference',
                tag: 'writing-style',
                limit: 10
            });
            if (styleMemories.length > 0) {
                // Aggregate writing style from multiple memories
                const style = {
                    tone: 'friendly',
                    length: 'medium',
                    complexity: 'moderate',
                    preferences: []
                };
                styleMemories.forEach(memory => {
                    if (memory.text.includes('tone:')) {
                        const toneMatch = memory.text.match(/tone:(\w+)/);
                        if (toneMatch) {
                            style.tone = toneMatch[1];
                        }
                    }
                    if (memory.text.includes('length:')) {
                        const lengthMatch = memory.text.match(/length:(\w+)/);
                        if (lengthMatch) {
                            style.length = lengthMatch[1];
                        }
                    }
                    if (memory.text.includes('complexity:')) {
                        const complexityMatch = memory.text.match(/complexity:(\w+)/);
                        if (complexityMatch) {
                            style.complexity = complexityMatch[1];
                        }
                    }
                    style.preferences.push(memory.text);
                });
                setWritingStyle(style);
            }
        }
        catch (err) {
            console.warn('Failed to load writing style:', err);
        }
    }, []);
    // Generate writing suggestions based on content and user style
    const generateSuggestions = useCallback(async (content) => {
        if (!enabled || !memorySDK.current || !content.trim()) {
            setSuggestions([]);
            return;
        }
        // Avoid regenerating suggestions for the same content
        if (content === lastContent.current) {
            return;
        }
        lastContent.current = content;
        setIsLoading(true);
        setError(null);
        try {
            // Get relevant memories for context
            const contextMemories = await memorySDK.current.recall({
                scope: 'user',
                ownerId: memorySDK.current['uid'],
                kind: 'preference',
                tag: 'writing',
                limit: 5
            });
            // Generate suggestions based on content analysis
            const newSuggestions = [];
            // Style suggestions based on user preferences
            if (writingStyle) {
                if (writingStyle.tone === 'formal' && content.includes('hey') || content.includes('yeah')) {
                    newSuggestions.push({
                        id: 'tone-formal',
                        type: 'tone',
                        text: 'Consider using more formal language',
                        confidence: 0.8,
                        reason: 'Your style preference is formal communication'
                    });
                }
                if (writingStyle.length === 'short' && content.length > 200) {
                    newSuggestions.push({
                        id: 'length-short',
                        type: 'style',
                        text: 'Consider shortening for better readability',
                        confidence: 0.7,
                        reason: 'You prefer concise communication'
                    });
                }
            }
            // Grammar and clarity suggestions
            if (content.includes('  ')) {
                newSuggestions.push({
                    id: 'spacing',
                    type: 'grammar',
                    text: 'Remove extra spaces',
                    confidence: 0.9,
                    reason: 'Double spaces detected'
                });
            }
            if (content.includes('!!')) {
                newSuggestions.push({
                    id: 'exclamation',
                    type: 'style',
                    text: 'Consider using single exclamation mark',
                    confidence: 0.6,
                    reason: 'Multiple exclamation marks can seem unprofessional'
                });
            }
            // Content suggestions based on context
            if (content.toLowerCase().includes('training') && contextMemories.length > 0) {
                const trainingMemory = contextMemories.find(m => m.text.includes('training'));
                if (trainingMemory) {
                    newSuggestions.push({
                        id: 'training-context',
                        type: 'content',
                        text: `Based on your preferences: ${trainingMemory.text}`,
                        confidence: 0.8,
                        reason: 'Relevant to your training preferences'
                    });
                }
            }
            setSuggestions(newSuggestions.slice(0, maxSuggestions));
        }
        catch (err) {
            setError(`Failed to generate suggestions: ${err}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [enabled, writingStyle, maxSuggestions]);
    // Learn from user feedback on suggestions
    const learnFromFeedback = useCallback(async (suggestionId, feedback) => {
        if (!memorySDK.current)
            return;
        try {
            const delta = feedback === 'positive' ? 0.3 : -0.2;
            const memoryFeedback = {
                delta,
                reason: `User ${feedback} feedback on suggestion: ${suggestionId}`,
                tags: ['feedback', 'suggestion', suggestionId]
            };
            // Find the suggestion and update its memory
            const suggestion = suggestions.find(s => s.id === suggestionId);
            if (suggestion) {
                // Store feedback as a new memory
                await memorySDK.current.remember({
                    tenantId,
                    scope: 'user',
                    ownerId: memorySDK.current['uid'],
                    kind: 'feedback',
                    text: `Suggestion feedback: ${suggestion.type} - ${suggestion.text} (${feedback})`,
                    tags: ['feedback', suggestion.type, feedback],
                    source: 'ui',
                    confidence: 0.9
                });
            }
        }
        catch (err) {
            console.warn('Failed to learn from feedback:', err);
        }
    }, [tenantId, suggestions]);
    // Update writing style based on user behavior
    const updateWritingStyle = useCallback(async (style) => {
        if (!memorySDK.current)
            return;
        try {
            const styleText = Object.entries(style)
                .map(([key, value]) => `${key}:${value}`)
                .join(', ');
            await memorySDK.current.remember({
                tenantId,
                scope: 'user',
                ownerId: memorySDK.current['uid'],
                kind: 'preference',
                text: `Writing style preference: ${styleText}`,
                tags: ['writing-style', 'preference'],
                source: 'ui',
                confidence: 0.8
            });
            setWritingStyle(prev => ({ ...prev, ...style }));
        }
        catch (err) {
            console.warn('Failed to update writing style:', err);
        }
    }, [tenantId]);
    return {
        suggestions,
        isLoading,
        error,
        writingStyle,
        generateSuggestions,
        learnFromFeedback,
        updateWritingStyle,
        isEnabled: enabled
    };
}

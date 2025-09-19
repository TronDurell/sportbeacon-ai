import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* SportBeaconAI - Creator Assist Feature
   AI-powered writing assistance with personal style memory
*/
import { useState, useEffect, useCallback } from 'react';
import { MemorySDK } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
import { useComposerAssist } from '../../hooks/useComposerAssist';
export function CreatorAssist({ tenantId, initialContent = '', onContentChange, onStyleUpdate }) {
    const [content, setContent] = useState(initialContent);
    const [personalStyle, setPersonalStyle] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [memorySDK, setMemorySDK] = useState(null);
    const { user } = useAuth();
    // Use the composer assist hook
    const { suggestions, isLoading, error, writingStyle, generateSuggestions, learnFromFeedback, updateWritingStyle, isEnabled } = useComposerAssist({
        tenantId,
        enabled: true,
        maxSuggestions: 8
    });
    // Initialize Memory SDK
    useEffect(() => {
        if (!user)
            return;
        const sdk = new MemorySDK({
            tenantId,
            user: { uid: user.uid }
        });
        setMemorySDK(sdk);
    }, [user, tenantId]);
    // Load personal style from memory
    const loadPersonalStyle = useCallback(async () => {
        if (!memorySDK || !user)
            return;
        try {
            const styleMemories = await memorySDK.recall({
                scope: 'user',
                ownerId: user.uid,
                kind: 'preference',
                tag: 'writing-style',
                limit: 20
            });
            if (styleMemories.length > 0) {
                const style = aggregatePersonalStyle(styleMemories);
                setPersonalStyle(style);
                onStyleUpdate?.(style);
            }
        }
        catch (err) {
            console.warn('Failed to load personal style:', err);
        }
    }, [memorySDK, user, onStyleUpdate]);
    // Aggregate personal style from multiple memories
    const aggregatePersonalStyle = (memories) => {
        const style = {
            tone: 'friendly',
            length: 'medium',
            complexity: 'moderate',
            engagement: 'medium',
            preferences: []
        };
        memories.forEach(memory => {
            const text = memory.text.toLowerCase();
            if (text.includes('tone:')) {
                const toneMatch = text.match(/tone:(\w+)/);
                if (toneMatch) {
                    style.tone = toneMatch[1];
                }
            }
            if (text.includes('length:')) {
                const lengthMatch = text.match(/length:(\w+)/);
                if (lengthMatch) {
                    style.length = lengthMatch[1];
                }
            }
            if (text.includes('complexity:')) {
                const complexityMatch = text.match(/complexity:(\w+)/);
                if (complexityMatch) {
                    style.complexity = complexityMatch[1];
                }
            }
            if (text.includes('engagement:')) {
                const engagementMatch = text.match(/engagement:(\w+)/);
                if (engagementMatch) {
                    style.engagement = engagementMatch[1];
                }
            }
            style.preferences.push(memory.text);
        });
        return style;
    };
    // Handle content change
    const handleContentChange = useCallback((newContent) => {
        setContent(newContent);
        onContentChange?.(newContent);
        // Generate suggestions after a delay
        if (newContent.trim()) {
            const timeoutId = setTimeout(() => {
                generateSuggestions(newContent);
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [onContentChange, generateSuggestions]);
    // Handle suggestion feedback
    const handleSuggestionFeedback = useCallback(async (suggestion, feedback) => {
        await learnFromFeedback(suggestion.id, feedback);
    }, [learnFromFeedback]);
    // Apply suggestion
    const applySuggestion = useCallback((suggestion) => {
        if (suggestion.suggestedText) {
            const newContent = content.replace(suggestion.originalText || '', suggestion.suggestedText);
            handleContentChange(newContent);
        }
    }, [content, handleContentChange]);
    // Update personal style
    const handleStyleUpdate = useCallback(async (newStyle) => {
        if (!personalStyle)
            return;
        const updatedStyle = { ...personalStyle, ...newStyle };
        setPersonalStyle(updatedStyle);
        onStyleUpdate?.(updatedStyle);
        // Save to memory
        if (memorySDK && user) {
            const styleText = Object.entries(updatedStyle)
                .filter(([key, value]) => key !== 'preferences')
                .map(([key, value]) => `${key}:${value}`)
                .join(', ');
            await memorySDK.remember({
                tenantId,
                scope: 'user',
                ownerId: user.uid,
                kind: 'preference',
                text: `Writing style: ${styleText}`,
                tags: ['writing-style', 'personalization'],
                source: 'ui',
                confidence: 0.9
            });
        }
    }, [personalStyle, onStyleUpdate, memorySDK, user, tenantId]);
    // Load personal style on mount
    useEffect(() => {
        loadPersonalStyle();
    }, [loadPersonalStyle]);
    // Generate suggestions when content changes
    useEffect(() => {
        if (content.trim()) {
            generateSuggestions(content);
        }
    }, [content, generateSuggestions]);
    return (_jsxs("div", { className: "creator-assist", children: [_jsxs("div", { className: "assist-header", children: [_jsx("h2", { children: "Creator Assist" }), _jsx("p", { className: "assist-subtitle", children: "AI-powered writing assistance with personal style memory" })] }), personalStyle && (_jsxs("div", { className: "personal-style", children: [_jsx("h3", { children: "Your Writing Style" }), _jsxs("div", { className: "style-indicators", children: [_jsxs("div", { className: "style-indicator", children: [_jsx("span", { className: "label", children: "Tone:" }), _jsxs("select", { value: personalStyle.tone, onChange: (e) => handleStyleUpdate({ tone: e.target.value }), children: [_jsx("option", { value: "formal", children: "Formal" }), _jsx("option", { value: "casual", children: "Casual" }), _jsx("option", { value: "friendly", children: "Friendly" }), _jsx("option", { value: "professional", children: "Professional" })] })] }), _jsxs("div", { className: "style-indicator", children: [_jsx("span", { className: "label", children: "Length:" }), _jsxs("select", { value: personalStyle.length, onChange: (e) => handleStyleUpdate({ length: e.target.value }), children: [_jsx("option", { value: "short", children: "Short" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "long", children: "Long" })] })] }), _jsxs("div", { className: "style-indicator", children: [_jsx("span", { className: "label", children: "Complexity:" }), _jsxs("select", { value: personalStyle.complexity, onChange: (e) => handleStyleUpdate({ complexity: e.target.value }), children: [_jsx("option", { value: "simple", children: "Simple" }), _jsx("option", { value: "moderate", children: "Moderate" }), _jsx("option", { value: "complex", children: "Complex" })] })] })] })] })), _jsxs("div", { className: "content-editor", children: [_jsx("textarea", { className: "content-input", placeholder: "Start writing your content here...", value: content, onChange: (e) => handleContentChange(e.target.value), rows: 10 }), isLoading && (_jsxs("div", { className: "analyzing-indicator", children: [_jsx("span", { className: "spinner", children: "\uD83D\uDD04" }), "Analyzing content..."] }))] }), suggestions.length > 0 && (_jsxs("div", { className: "suggestions-panel", children: [_jsx("h3", { children: "Writing Suggestions" }), _jsx("div", { className: "suggestions-list", children: suggestions.map(suggestion => (_jsx(SuggestionItem, { suggestion: suggestion, onApply: () => applySuggestion(suggestion), onFeedback: (feedback) => handleSuggestionFeedback(suggestion, feedback) }, suggestion.id))) })] })), error && (_jsx("div", { className: "error-message", children: error })), content && suggestions.length === 0 && !isLoading && (_jsx("div", { className: "no-suggestions", children: _jsx("p", { children: "Great content! No suggestions at this time." }) }))] }));
}
function SuggestionItem({ suggestion, onApply, onFeedback }) {
    const [showFeedback, setShowFeedback] = useState(false);
    const typeIcon = {
        style: '🎨',
        grammar: '📝',
        tone: '🎭',
        content: '💡',
        engagement: '📈'
    };
    const typeColor = {
        style: '#ff6b6b',
        grammar: '#4ecdc4',
        tone: '#45b7d1',
        content: '#96ceb4',
        engagement: '#feca57'
    };
    return (_jsxs("div", { className: "suggestion-item", children: [_jsxs("div", { className: "suggestion-header", children: [_jsxs("span", { className: "suggestion-type", style: { color: typeColor[suggestion.type] }, children: [typeIcon[suggestion.type], " ", suggestion.type] }), _jsxs("span", { className: "suggestion-confidence", children: [(suggestion.confidence * 100).toFixed(0), "%"] })] }), _jsxs("div", { className: "suggestion-content", children: [_jsx("p", { className: "suggestion-text", children: suggestion.text }), suggestion.reason && (_jsx("p", { className: "suggestion-reason", children: suggestion.reason })), suggestion.suggestedText && (_jsxs("div", { className: "suggestion-preview", children: [_jsxs("div", { className: "original-text", children: [_jsx("strong", { children: "Original:" }), " ", suggestion.originalText] }), _jsxs("div", { className: "suggested-text", children: [_jsx("strong", { children: "Suggested:" }), " ", suggestion.suggestedText] })] }))] }), _jsxs("div", { className: "suggestion-actions", children: [suggestion.suggestedText && (_jsx("button", { className: "apply-button", onClick: onApply, children: "Apply Suggestion" })), _jsx("button", { className: "feedback-button", onClick: () => setShowFeedback(!showFeedback), children: "\uD83D\uDCAD" }), showFeedback && (_jsxs("div", { className: "feedback-panel", children: [_jsx("button", { className: "feedback-positive", onClick: () => {
                                    onFeedback('positive');
                                    setShowFeedback(false);
                                }, children: "\uD83D\uDC4D Helpful" }), _jsx("button", { className: "feedback-negative", onClick: () => {
                                    onFeedback('negative');
                                    setShowFeedback(false);
                                }, children: "\uD83D\uDC4E Not helpful" })] }))] })] }));
}

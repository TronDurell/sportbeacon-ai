import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* SportBeaconAI - Moderator Triage Assistant
   AI-powered content analysis with automated triage recommendations
*/
import { useState, useEffect, useCallback } from 'react';
import { MemorySDK } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
export function TriageAssistant({ tenantId, onTriageDecision, onFeedback }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [memorySDK, setMemorySDK] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const { user } = useAuth();
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
    // Load triage items
    const loadTriageItems = useCallback(async () => {
        if (!memorySDK || !user)
            return;
        setIsLoading(true);
        setError(null);
        try {
            // Get moderation patterns from memory
            const patterns = await memorySDK.current?.recall({
                scope: 'agent',
                ownerId: 'moderation-agent',
                kind: 'fact',
                tag: 'moderation-pattern',
                limit: 50
            });
            // Get historical triage decisions
            const decisions = await memorySDK.current?.recall({
                scope: 'agent',
                ownerId: 'moderation-agent',
                kind: 'feedback',
                tag: 'triage-decision',
                limit: 100
            });
            // Generate triage items (in real implementation, these would come from your moderation queue)
            const triageItems = await generateTriageItems(patterns, decisions);
            setItems(triageItems);
        }
        catch (err) {
            setError(`Failed to load triage items: ${err}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [memorySDK, user]);
    // Generate triage items with AI analysis
    const generateTriageItems = async (patterns, decisions) => {
        const items = [];
        // Mock content that needs triage
        const mockContent = [
            {
                id: 'triage-1',
                type: 'post',
                content: 'This is a great training session! Really helpful tips.',
                severity: 'low',
                category: 'other',
                confidence: 0.95,
                suggestedAction: 'approve',
                reasoning: 'Positive content with no violations detected',
                metadata: { locationId: 'loc-1', authorId: 'user-1' }
            },
            {
                id: 'triage-2',
                type: 'post',
                content: 'You guys are all losers and this sport is stupid',
                severity: 'high',
                category: 'harassment',
                confidence: 0.88,
                suggestedAction: 'reject',
                reasoning: 'Harassment detected: insulting language targeting users',
                metadata: { locationId: 'loc-2', authorId: 'user-2' }
            },
            {
                id: 'triage-3',
                type: 'post',
                content: 'Check out this amazing deal! 50% off everything!',
                severity: 'medium',
                category: 'spam',
                confidence: 0.75,
                suggestedAction: 'review',
                reasoning: 'Potential spam: promotional content without context',
                metadata: { locationId: 'loc-3', authorId: 'user-3' }
            }
        ];
        // Enhance with AI analysis based on patterns
        mockContent.forEach(content => {
            const similarCases = findSimilarCases(content, decisions);
            const enhancedReasoning = enhanceReasoning(content, patterns, similarCases);
            items.push({
                ...content,
                similarCases,
                reasoning: enhancedReasoning,
                createdAt: new Date().toISOString()
            });
        });
        return items;
    };
    // Find similar historical cases
    const findSimilarCases = (content, decisions) => {
        // In a real implementation, this would use semantic similarity
        return decisions.slice(0, 3).map(decision => ({
            id: decision.id || 'unknown',
            content: decision.text,
            action: decision.text.includes('approve') ? 'approve' : 'reject',
            outcome: decision.score && decision.score > 0 ? 'correct' : 'incorrect',
            moderatorId: 'moderator-1',
            timestamp: (() => {
                if (!decision.createdAt)
                    return new Date().toISOString();
                if (decision.createdAt instanceof Date)
                    return decision.createdAt.toISOString();
                if (typeof decision.createdAt === 'string')
                    return new Date(decision.createdAt).toISOString();
                if (typeof decision.createdAt === 'number')
                    return new Date(decision.createdAt).toISOString();
                return new Date().toISOString();
            })()
        }));
    };
    // Enhance reasoning with AI insights
    const enhanceReasoning = (content, patterns, similarCases) => {
        let reasoning = content.reasoning;
        // Add pattern-based insights
        const relevantPatterns = patterns.filter(p => p.text.toLowerCase().includes(content.category) ||
            p.text.toLowerCase().includes(content.severity));
        if (relevantPatterns.length > 0) {
            reasoning += `\n\nPattern Analysis: ${relevantPatterns[0]?.text || 'No pattern data available'}`;
        }
        // Add similar case insights
        if (similarCases.length > 0) {
            const correctCases = similarCases.filter(c => c.outcome === 'correct').length;
            reasoning += `\n\nSimilar Cases: ${correctCases}/${similarCases.length} similar cases were handled correctly.`;
        }
        return reasoning;
    };
    // Handle triage decision
    const handleTriageDecision = useCallback(async (item, decision, reasoning) => {
        if (!memorySDK || !user)
            return;
        try {
            // Store decision in memory for learning
            await memorySDK.current?.remember({
                tenantId,
                scope: 'agent',
                ownerId: 'moderation-agent',
                kind: 'task',
                text: `Triage decision: ${decision} for content "${item.content}" - ${reasoning}`,
                tags: ['triage-decision', decision, item.category, item.severity],
                source: 'api',
                confidence: item.confidence
            });
            // Call parent callback
            onTriageDecision?.(item, decision, reasoning);
            // Remove item from list
            setItems(prev => prev.filter(i => i.id !== item.id));
        }
        catch (err) {
            console.error('Failed to process triage decision:', err);
        }
    }, [memorySDK, user, tenantId, onTriageDecision]);
    // Handle feedback on triage decision
    const handleFeedback = useCallback(async (item, feedback) => {
        if (!memorySDK || !user)
            return;
        try {
            // Learn from feedback
            const delta = feedback === 'correct' ? 0.3 : -0.2;
            await memorySDK.current?.learn(item.id, 'agent', 'moderation-agent', {
                delta,
                reason: `Triage decision feedback: ${feedback} for ${item.suggestedAction}`,
                tags: ['triage-feedback', feedback, item.category]
            });
            // Call parent callback
            onFeedback?.(item, feedback);
        }
        catch (err) {
            console.error('Failed to process feedback:', err);
        }
    }, [memorySDK, user, onFeedback]);
    // Load items on mount
    useEffect(() => {
        loadTriageItems();
    }, [loadTriageItems]);
    if (isLoading) {
        return (_jsx("div", { className: "triage-assistant loading", children: _jsxs("div", { className: "triage-header", children: [_jsx("h2", { children: "Moderation Triage Assistant" }), _jsx("div", { className: "loading-spinner", children: "Analyzing content..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "triage-assistant error", children: _jsxs("div", { className: "triage-header", children: [_jsx("h2", { children: "Moderation Triage Assistant" }), _jsx("div", { className: "error-message", children: error })] }) }));
    }
    return (_jsxs("div", { className: "triage-assistant", children: [_jsxs("div", { className: "triage-header", children: [_jsx("h2", { children: "Moderation Triage Assistant" }), _jsx("p", { className: "triage-subtitle", children: "AI-powered content analysis and triage recommendations" })] }), _jsx("div", { className: "triage-items", children: items.map(item => (_jsx(TriageItem, { item: item, onDecision: handleTriageDecision, onFeedback: handleFeedback, onSelect: () => setSelectedItem(item), isSelected: selectedItem?.id === item.id }, item.id))) }), items.length === 0 && (_jsxs("div", { className: "empty-state", children: [_jsx("p", { children: "No items require triage at this time." }), _jsx("p", { children: "Great job keeping the community safe!" })] }))] }));
}
function TriageItem({ item, onDecision, onFeedback, onSelect, isSelected }) {
    const [showFeedback, setShowFeedback] = useState(false);
    const [customReasoning, setCustomReasoning] = useState('');
    const severityColor = {
        low: '#44aa44',
        medium: '#ffaa00',
        high: '#ff4444',
        critical: '#aa0000'
    };
    const categoryIcon = {
        spam: '📧',
        harassment: '⚠️',
        inappropriate: '🚫',
        fake: '🎭',
        other: '❓'
    };
    return (_jsxs("div", { className: `triage-item ${isSelected ? 'selected' : ''}`, onClick: onSelect, children: [_jsxs("div", { className: "item-header", children: [_jsxs("span", { className: "item-category", children: [categoryIcon[item.category], " ", item.category] }), _jsx("span", { className: "item-severity", style: { backgroundColor: severityColor[item.severity] }, children: item.severity }), _jsxs("span", { className: "item-confidence", children: ["Confidence: ", (item.confidence * 100).toFixed(0), "%"] })] }), _jsx("div", { className: "item-content", children: _jsx("p", { className: "content-text", children: item.content }) }), _jsxs("div", { className: "item-analysis", children: [_jsx("h4", { children: "AI Analysis:" }), _jsx("p", { className: "reasoning", children: item.reasoning }), _jsxs("div", { className: "suggested-action", children: [_jsx("strong", { children: "Suggested Action:" }), " ", item.suggestedAction] })] }), item.similarCases && item.similarCases.length > 0 && (_jsxs("div", { className: "similar-cases", children: [_jsx("h4", { children: "Similar Cases:" }), item.similarCases.map(case_ => (_jsxs("div", { className: "similar-case", children: [_jsx("span", { className: `case-outcome ${case_.outcome}`, children: case_.outcome === 'correct' ? '✅' : '❌' }), _jsx("span", { className: "case-action", children: case_.action }), _jsxs("span", { className: "case-content", children: [case_.content.substring(0, 50), "..."] })] }, case_.id)))] })), _jsxs("div", { className: "item-actions", children: [_jsxs("div", { className: "decision-buttons", children: [_jsx("button", { className: "decision-button approve", onClick: (e) => {
                                    e.stopPropagation();
                                    onDecision(item, 'approve', customReasoning || 'Content approved by moderator');
                                }, children: "\u2705 Approve" }), _jsx("button", { className: "decision-button reject", onClick: (e) => {
                                    e.stopPropagation();
                                    onDecision(item, 'reject', customReasoning || 'Content rejected by moderator');
                                }, children: "\u274C Reject" }), _jsx("button", { className: "decision-button review", onClick: (e) => {
                                    e.stopPropagation();
                                    onDecision(item, 'review', customReasoning || 'Content flagged for manual review');
                                }, children: "\uD83D\uDC40 Review" }), _jsx("button", { className: "decision-button escalate", onClick: (e) => {
                                    e.stopPropagation();
                                    onDecision(item, 'escalate', customReasoning || 'Content escalated to senior moderator');
                                }, children: "\uD83D\uDEA8 Escalate" })] }), _jsx("div", { className: "custom-reasoning", children: _jsx("textarea", { placeholder: "Add custom reasoning (optional)", value: customReasoning, onChange: (e) => setCustomReasoning(e.target.value), onClick: (e) => e.stopPropagation() }) }), _jsx("button", { className: "feedback-button", onClick: (e) => {
                            e.stopPropagation();
                            setShowFeedback(!showFeedback);
                        }, children: "\uD83D\uDCAD Feedback" }), showFeedback && (_jsxs("div", { className: "feedback-panel", children: [_jsx("button", { className: "feedback-correct", onClick: (e) => {
                                    e.stopPropagation();
                                    onFeedback(item, 'correct');
                                    setShowFeedback(false);
                                }, children: "\u2705 Correct" }), _jsx("button", { className: "feedback-incorrect", onClick: (e) => {
                                    e.stopPropagation();
                                    onFeedback(item, 'incorrect');
                                    setShowFeedback(false);
                                }, children: "\u274C Incorrect" })] }))] })] }));
}

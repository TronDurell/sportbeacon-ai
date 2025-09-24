import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* SportBeaconAI - Daily Digest Feature
   Personalized content recommendations with memory integration
*/
import { useState, useEffect, useCallback } from 'react';
import { MemorySDK } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
export function DailyDigest({ tenantId, maxItems = 10, onItemClick, onFeedback }) {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [memorySDK, setMemorySDK] = useState(null);
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
    // Load personalized digest
    const loadDigest = useCallback(async () => {
        if (!memorySDK || !user)
            return;
        setIsLoading(true);
        setError(null);
        try {
            // Get user preferences from memory
            const preferences = await memorySDK.current?.recall({
                scope: 'user',
                ownerId: user.uid,
                kind: 'preference',
                tag: 'digest',
                limit: 20
            });
            // Get user goals from memory
            const goals = await memorySDK.current?.recall({
                scope: 'user',
                ownerId: user.uid,
                kind: 'goal',
                limit: 10
            });
            // Generate personalized digest items
            const digestItems = await generatePersonalizedDigest(preferences, goals, user);
            setItems(digestItems.slice(0, maxItems));
        }
        catch (err) {
            setError(`Failed to load daily digest: ${err}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [memorySDK, user, maxItems]);
    // Generate personalized digest items
    const generatePersonalizedDigest = async (preferences, goals, user) => {
        const items = [];
        // Create items based on user preferences
        preferences.forEach(pref => {
            if (pref.text.includes('training')) {
                items.push({
                    id: `pref-${pref.id}`,
                    type: 'recommendation',
                    title: 'Training Session Recommendation',
                    description: `Based on your preference for ${pref.text}`,
                    priority: 'high',
                    source: pref,
                    relevanceScore: 0.9,
                    personalizedReason: `Matches your training preference: ${pref.text}`
                });
            }
        });
        // Create items based on user goals
        goals.forEach(goal => {
            items.push({
                id: `goal-${goal.id}`,
                type: 'memory',
                title: 'Goal Progress Update',
                description: `Track progress on: ${goal.text}`,
                priority: 'medium',
                source: goal,
                relevanceScore: 0.8,
                personalizedReason: `Supports your goal: ${goal.text}`
            });
        });
        // Add mock content items (in real implementation, these would come from your content API)
        const mockPosts = [
            {
                id: 'post-1',
                locationId: 'loc-1',
                userId: 'user-1',
                authorId: 'user-1',
                content: 'Great training session today!',
                type: 'note',
                text: 'Great training session today!',
                media: [],
                pinned: false,
                visibility: 'public',
                likeCount: 5,
                replyCount: 2,
                reportCount: 0,
                deviceGeo: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        mockPosts.forEach(post => {
            items.push({
                id: `post-${post.id}`,
                type: 'post',
                title: 'New Activity in Your Network',
                description: post.content,
                priority: 'medium',
                source: post,
                relevanceScore: 0.7,
                personalizedReason: 'From your followed locations'
            });
        });
        // Sort by relevance score
        return items.sort((a, b) => b.relevanceScore - a.relevanceScore);
    };
    // Handle item feedback
    const handleFeedback = useCallback(async (item, feedback) => {
        if (!memorySDK || !user)
            return;
        try {
            // Learn from feedback
            const delta = feedback === 'positive' ? 0.3 : -0.2;
            await memorySDK.current?.learn(item.id, 'user', user.uid, {
                delta,
                reason: `User ${feedback} feedback on digest item: ${item.title}`,
                tags: ['digest', 'feedback', feedback]
            });
            // Call parent callback
            onFeedback?.(item, feedback);
            // Reload digest to reflect learning
            await loadDigest();
        }
        catch (err) {
            console.error('Failed to process feedback:', err);
        }
    }, [memorySDK, user, onFeedback, loadDigest]);
    // Load digest on mount
    useEffect(() => {
        loadDigest();
    }, [loadDigest]);
    if (isLoading) {
        return (_jsx("div", { className: "daily-digest loading", children: _jsxs("div", { className: "digest-header", children: [_jsx("h2", { children: "Daily Digest" }), _jsx("div", { className: "loading-spinner", children: "Loading personalized content..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "daily-digest error", children: _jsxs("div", { className: "digest-header", children: [_jsx("h2", { children: "Daily Digest" }), _jsx("div", { className: "error-message", children: error })] }) }));
    }
    return (_jsxs("div", { className: "daily-digest", children: [_jsxs("div", { className: "digest-header", children: [_jsx("h2", { children: "Daily Digest" }), _jsx("p", { className: "digest-subtitle", children: "Personalized for you based on your preferences and goals" })] }), _jsx("div", { className: "digest-items", children: items.map(item => (_jsx(DigestItem, { item: item, onClick: () => onItemClick?.(item), onFeedback: (feedback) => handleFeedback(item, feedback) }, item.id))) }), items.length === 0 && (_jsxs("div", { className: "empty-state", children: [_jsx("p", { children: "No personalized content available yet." }), _jsx("p", { children: "Start using the app to build your personalized digest!" })] }))] }));
}
function DigestItem({ item, onClick, onFeedback }) {
    const [showFeedback, setShowFeedback] = useState(false);
    const priorityColor = {
        high: '#ff4444',
        medium: '#ffaa00',
        low: '#44aa44'
    };
    const typeIcon = {
        post: '📝',
        event: '📅',
        recommendation: '💡',
        memory: '🧠'
    };
    return (_jsxs("div", { className: "digest-item", onClick: onClick, children: [_jsxs("div", { className: "item-header", children: [_jsx("span", { className: "item-type", children: typeIcon[item.type] }), _jsx("span", { className: "item-priority", style: { backgroundColor: priorityColor[item.priority] }, children: item.priority }), _jsxs("span", { className: "item-score", children: ["Score: ", item.relevanceScore.toFixed(2)] })] }), _jsx("h3", { className: "item-title", children: item.title }), _jsx("p", { className: "item-description", children: item.description }), item.personalizedReason && (_jsxs("p", { className: "personalized-reason", children: [_jsx("strong", { children: "Why this matters to you:" }), " ", item.personalizedReason] })), _jsxs("div", { className: "item-actions", children: [_jsx("button", { className: "feedback-button", onClick: (e) => {
                            e.stopPropagation();
                            setShowFeedback(!showFeedback);
                        }, children: "\uD83D\uDCAD" }), showFeedback && (_jsxs("div", { className: "feedback-panel", children: [_jsx("button", { className: "feedback-positive", onClick: (e) => {
                                    e.stopPropagation();
                                    onFeedback('positive');
                                    setShowFeedback(false);
                                }, children: "\uD83D\uDC4D Helpful" }), _jsx("button", { className: "feedback-negative", onClick: (e) => {
                                    e.stopPropagation();
                                    onFeedback('negative');
                                    setShowFeedback(false);
                                }, children: "\uD83D\uDC4E Not helpful" })] }))] })] }));
}

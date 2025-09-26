import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Feed Page with SEL-Highlight Blended Ranking
 * Demonstrates the feature-flagged ranking system
 */
import { useState, useEffect } from 'react';
import { isSelBlendEnabled, getDefaultWeights } from '../config/feed';
import { rankPosts, backfillResilienceScores } from '../ranking/blend';
import { getCachedAbAssignment, getVariantConfig } from '../ab/assign';
import { ExplainabilitySection } from '../components/WhyChip';
import { trackFeedMix, initializeFeedSession } from '../telemetry/feed';
// Mock data for demonstration
const mockFeedItems = [
    {
        id: '1',
        type: 'tip',
        content: 'Building resilience in sports means learning to bounce back from setbacks. Every failure is a lesson that makes you stronger.',
        author: { id: '1', name: 'Coach Sarah', avatar: '/avatars/coach-sarah.jpg' },
        timestamp: new Date().toISOString(),
        likes: 45,
        comments: 12,
        shares: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        engagementScore: 0.8,
        resilienceScore: 0.9, // High SEL content
        stats: { views: 120, likes: 45, shares: 8, comments: 12 },
        userInteraction: { liked: false, shared: false, bookmarked: false }
    },
    {
        id: '2',
        type: 'highlight',
        content: 'Amazing goal from last night\'s game! Check out this incredible shot! 🚀',
        author: { id: '2', name: 'Sports Fan', avatar: '/avatars/fan.jpg' },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        likes: 120,
        comments: 35,
        shares: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        engagementScore: 0.95, // High engagement
        resilienceScore: 0.2, // Low SEL content
        stats: { views: 500, likes: 120, shares: 25, comments: 35 },
        userInteraction: { liked: true, shared: false, bookmarked: false }
    },
    {
        id: '3',
        type: 'story',
        content: 'Today I learned that teamwork isn\'t just about winning games. It\'s about supporting each other through challenges and growing together as people.',
        author: { id: '3', name: 'Player Mike', avatar: '/avatars/player-mike.jpg' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        likes: 28,
        comments: 8,
        shares: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        engagementScore: 0.6,
        resilienceScore: 0.8, // High SEL content
        stats: { views: 80, likes: 28, shares: 5, comments: 8 },
        userInteraction: { liked: false, shared: true, bookmarked: false }
    }
];
export const Feed = () => {
    const [feedItems, setFeedItems] = useState([]);
    const [rankingEnabled, setRankingEnabled] = useState(false);
    const [variant, setVariant] = useState('C');
    const [sessionTracker, setSessionTracker] = useState(null);
    useEffect(() => {
        // Initialize A/B testing and session tracking
        const userId = 'demo-user-123';
        const abAssignment = getCachedAbAssignment(userId);
        setVariant(abAssignment.variant);
        // Initialize session tracking
        const tracker = initializeFeedSession(userId, abAssignment.variant);
        setSessionTracker(tracker);
        // Check if SEL blend feature is enabled
        const enabled = isSelBlendEnabled();
        setRankingEnabled(enabled);
        // Process feed items
        let processedItems = [...mockFeedItems];
        if (enabled) {
            // Backfill resilience scores for items that don't have them
            processedItems = backfillResilienceScores(processedItems);
            // Get ranking weights based on A/B variant
            const variantWeights = getVariantConfig(abAssignment.variant);
            const userWeights = getDefaultWeights(); // Could be from user preferences
            // Use variant weights for ranking
            const finalWeights = {
                sel: variantWeights.selWeight,
                engagement: variantWeights.engagementWeight,
                recency: variantWeights.recencyWeight
            };
            // Rank posts using blended scoring
            processedItems = rankPosts(processedItems, finalWeights);
            // Track feed mix for analytics
            const avgSelScore = processedItems.reduce((sum, item) => sum + (item.resilienceScore ?? 0), 0) / processedItems.length;
            const avgEngagementScore = processedItems.reduce((sum, item) => sum + item.engagementScore, 0) / processedItems.length;
            trackFeedMix({
                userId,
                selWeight: finalWeights.sel,
                engagementWeight: finalWeights.engagement,
                recencyWeight: finalWeights.recency,
                postCount: processedItems.length,
                avgSelScore,
                avgEngagementScore,
                variant: abAssignment.variant
            });
        }
        setFeedItems(processedItems);
    }, []);
    const handlePostInteraction = (postId, interactionType) => {
        // Track interaction for analytics
        if (sessionTracker) {
            const post = feedItems.find(item => item.id === postId);
            if (post) {
                sessionTracker.trackPostInteraction(postId, (post.resilienceScore ?? 0) > 0.5);
            }
        }
    };
    return (_jsxs("div", { className: "feed-container", style: { maxWidth: '600px', margin: '0 auto', padding: '20px' }, children: [_jsxs("div", { className: "feed-header", style: { marginBottom: '20px' }, children: [_jsx("h1", { children: "SportBeaconAI Feed" }), _jsxs("div", { className: "feed-status", style: {
                            padding: '10px',
                            backgroundColor: rankingEnabled ? '#e8f5e8' : '#f0f0f0',
                            borderRadius: '5px',
                            fontSize: '14px'
                        }, children: [_jsx("strong", { children: "Ranking Status:" }), " ", rankingEnabled ? '✅ SEL-Blend Enabled' : '❌ Legacy Ranking', _jsx("br", {}), _jsx("strong", { children: "A/B Variant:" }), " ", variant, " (", variant === 'A' ? 'Highlights-focused' : variant === 'B' ? 'SEL-focused' : 'Blended', ")"] })] }), _jsx("div", { className: "feed-items", children: feedItems.map((item, index) => {
                    const author = typeof item.author === 'string' ? { id: item.id, name: item.author, avatar: '' } : item.author;
                    return (_jsxs("div", { className: "feed-item", style: {
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '16px',
                            backgroundColor: '#fff'
                        }, children: [_jsxs("div", { className: "post-header", style: { display: 'flex', alignItems: 'center', marginBottom: '12px' }, children: [_jsx("img", { src: author.avatar, alt: author.name, style: { width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }, onError: (e) => {
                                            e.target.src = 'https://via.placeholder.com/40';
                                        } }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 'bold' }, children: author.name }), _jsx("div", { style: { fontSize: '12px', color: '#666' }, children: new Date(item.timestamp).toLocaleTimeString() })] })] }), _jsx("div", { className: "post-content", style: { marginBottom: '12px' }, children: item.content }), _jsxs("div", { className: "post-stats", style: { fontSize: '12px', color: '#666', marginBottom: '8px' }, children: ["Rank #", index + 1, " \u2022 Engagement: ", (item.engagementScore * 100).toFixed(0), "% \u2022 SEL: ", ((item.resilienceScore ?? 0) * 100).toFixed(0), "%"] }), rankingEnabled && (_jsx(ExplainabilitySection, { post: {
                                    resilienceScore: item.resilienceScore,
                                    engagementScore: item.engagementScore,
                                    ts: new Date(item.timestamp).getTime()
                                }, weights: {
                                    sel: 0.35,
                                    engagement: 0.5,
                                    recency: 0.15
                                } })), _jsxs("div", { className: "post-actions", style: { display: 'flex', gap: '16px' }, children: [_jsxs("button", { onClick: () => handlePostInteraction(item.id, 'like'), style: {
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: item.userInteraction.liked ? '#e74c3c' : '#666'
                                        }, children: ["\u2764\uFE0F ", item.likes] }), _jsxs("button", { onClick: () => handlePostInteraction(item.id, 'comment'), style: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' }, children: ["\uD83D\uDCAC ", item.comments] }), _jsxs("button", { onClick: () => handlePostInteraction(item.id, 'share'), style: {
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: item.userInteraction.shared ? '#3498db' : '#666'
                                        }, children: ["\uD83D\uDCE4 ", item.shares] })] })] }, item.id));
                }) }), _jsxs("div", { className: "feed-footer", style: {
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px'
                }, children: [_jsx("h3", { children: "How the Ranking Works" }), _jsxs("ul", { children: [_jsxs("li", { children: [_jsx("strong", { children: "Variant A (Highlights):" }), " Prioritizes high-engagement content"] }), _jsxs("li", { children: [_jsx("strong", { children: "Variant B (SEL):" }), " Emphasizes social-emotional learning content"] }), _jsxs("li", { children: [_jsx("strong", { children: "Variant C (Blended):" }), " Balances both engagement and SEL signals"] })] }), _jsx("p", { children: "The ranking system combines engagement scores, resilience scores, and recency to create a personalized feed that promotes both entertainment and personal growth." })] })] }));
};
export default Feed;

import { fetchWithAuth } from './api';
class CommunityFeed {
    socket = null;
    TOXICITY_THRESHOLD = 0.7;
    MODERATION_QUEUE_THRESHOLD = 0.5;
    constructor() {
        this.initializeWebSocket();
    }
    initializeWebSocket() {
        this.socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
        this.socket.onclose = () => {
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }
    async getTrainerFeed(trainerId, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.offset)
            queryParams.append('offset', params.offset.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        if (params.types)
            queryParams.append('types', params.types.join(','));
        const response = await fetchWithAuth(`/api/trainers/${trainerId}/feed?${queryParams.toString()}`);
        return response.json();
    }
    async getTeamFeed(teamId, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.offset)
            queryParams.append('offset', params.offset.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        if (params.types)
            queryParams.append('types', params.types.join(','));
        const response = await fetchWithAuth(`/api/teams/${teamId}/feed?${queryParams.toString()}`);
        return response.json();
    }
    async analyzeContent(content) {
        const response = await fetchWithAuth('/api/content/analyze', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
        return response.json();
    }
    async addComment(feedItemId, content, userId) {
        // Analyze content before posting
        const analysis = await this.analyzeContent(content);
        // Check for high toxicity
        if (analysis.toxicity.score >= this.TOXICITY_THRESHOLD) {
            throw new Error('Comment contains inappropriate content');
        }
        // If moderate toxicity, send to moderation queue
        const requiresModeration = analysis.toxicity.score >= this.MODERATION_QUEUE_THRESHOLD;
        const response = await fetchWithAuth(`/api/feed/${feedItemId}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                userId,
                analysis,
                requiresModeration,
            }),
        });
        const comment = await response.json();
        // Notify team members
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'new_comment',
                data: {
                    feedItemId,
                    comment,
                },
            }));
        }
        return comment;
    }
    async addReaction(feedItemId, userId, reactionType) {
        await fetchWithAuth(`/api/feed/${feedItemId}/reactions`, {
            method: 'POST',
            body: JSON.stringify({
                userId,
                type: reactionType,
            }),
        });
        // Notify team members
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'new_reaction',
                data: {
                    feedItemId,
                    userId,
                    reactionType,
                },
            }));
        }
    }
    async removeReaction(feedItemId, userId, reactionType) {
        await fetchWithAuth(`/api/feed/${feedItemId}/reactions`, {
            method: 'DELETE',
            body: JSON.stringify({
                userId,
                type: reactionType,
            }),
        });
    }
    async reportContent(feedItemId, contentType, contentId, reason, details) {
        await fetchWithAuth('/api/content/report', {
            method: 'POST',
            body: JSON.stringify({
                feedItemId,
                contentType,
                contentId,
                reason,
                details,
            }),
        });
    }
    async getModerationQueue(teamId) {
        const response = await fetchWithAuth(`/api/teams/${teamId}/moderation`);
        return response.json();
    }
    async moderateContent(contentId, action, reason) {
        await fetchWithAuth(`/api/content/${contentId}/moderate`, {
            method: 'POST',
            body: JSON.stringify({
                action,
                reason,
            }),
        });
    }
}
export const communityFeed = new CommunityFeed();

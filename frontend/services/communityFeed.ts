import { fetchWithAuth } from './api';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  sentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'neutral' | 'negative';
  };
  toxicity: {
    score: number; // 0 to 1
    flags: {
      hate: boolean;
      harassment: boolean;
      profanity: boolean;
      spam: boolean;
    };
  };
  reactions: {
    type: string;
    count: number;
    userReacted: boolean;
  }[];
}

export interface FeedItem {
  id: string;
  type: 'team_update' | 'achievement' | 'milestone' | 'event' | 'highlight';
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }[];
  comments: Comment[];
  reactions: {
    type: string;
    count: number;
    userReacted: boolean;
  }[];
  metadata?: Record<string, any>;
}

interface ContentAnalysis {
  sentiment: Comment['sentiment'];
  toxicity: Comment['toxicity'];
}

class CommunityFeed {
  private socket: WebSocket | null = null;
  private readonly TOXICITY_THRESHOLD = 0.7;
  private readonly MODERATION_QUEUE_THRESHOLD = 0.5;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    this.socket = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    );

    this.socket.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  async getTrainerFeed(
    trainerId: string,
    params: {
      offset?: number;
      limit?: number;
      types?: FeedItem['type'][];
    } = {}
  ): Promise<{
    items: FeedItem[];
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.types) queryParams.append('types', params.types.join(','));

    const response = await fetchWithAuth(
      `/api/trainers/${trainerId}/feed?${queryParams.toString()}`
    );
    return response.json();
  }

  async getTeamFeed(
    teamId: string,
    params: {
      offset?: number;
      limit?: number;
      types?: FeedItem['type'][];
    } = {}
  ): Promise<{
    items: FeedItem[];
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.types) queryParams.append('types', params.types.join(','));

    const response = await fetchWithAuth(
      `/api/teams/${teamId}/feed?${queryParams.toString()}`
    );
    return response.json();
  }

  private async analyzeContent(content: string): Promise<ContentAnalysis> {
    const response = await fetchWithAuth('/api/content/analyze', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.json();
  }

  async addComment(
    feedItemId: string,
    content: string,
    userId: string
  ): Promise<Comment> {
    // Analyze content before posting
    const analysis = await this.analyzeContent(content);

    // Check for high toxicity
    if (analysis.toxicity.score >= this.TOXICITY_THRESHOLD) {
      throw new Error('Comment contains inappropriate content');
    }

    // If moderate toxicity, send to moderation queue
    const requiresModeration =
      analysis.toxicity.score >= this.MODERATION_QUEUE_THRESHOLD;

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
      this.socket.send(
        JSON.stringify({
          type: 'new_comment',
          data: {
            feedItemId,
            comment,
          },
        })
      );
    }

    return comment;
  }

  async addReaction(
    feedItemId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    await fetchWithAuth(`/api/feed/${feedItemId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type: reactionType,
      }),
    });

    // Notify team members
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'new_reaction',
          data: {
            feedItemId,
            userId,
            reactionType,
          },
        })
      );
    }
  }

  async removeReaction(
    feedItemId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    await fetchWithAuth(`/api/feed/${feedItemId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({
        userId,
        type: reactionType,
      }),
    });
  }

  async reportContent(
    feedItemId: string,
    contentType: 'post' | 'comment',
    contentId: string,
    reason: string,
    details?: string
  ): Promise<void> {
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

  async getModerationQueue(teamId: string): Promise<{
    items: (FeedItem | Comment)[];
    total: number;
  }> {
    const response = await fetchWithAuth(`/api/teams/${teamId}/moderation`);
    return response.json();
  }

  async moderateContent(
    contentId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<void> {
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

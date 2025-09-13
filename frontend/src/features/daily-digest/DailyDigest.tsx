/* SportBeaconAI - Daily Digest Feature
   Personalized content recommendations with memory integration
*/

import React, { useState, useEffect, useCallback } from 'react';
import { MemorySDK, type Memory } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
import { type User, type LocationPost, type Event } from '../../types';

export interface DailyDigestItem {
  id: string;
  type: 'post' | 'event' | 'recommendation' | 'memory';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: LocationPost | Event | Memory;
  relevanceScore: number;
  personalizedReason?: string;
}

export interface DailyDigestProps {
  tenantId: string;
  maxItems?: number;
  onItemClick?: (item: DailyDigestItem) => void;
  onFeedback?: (item: DailyDigestItem, feedback: 'positive' | 'negative') => void;
}

export function DailyDigest({ 
  tenantId, 
  maxItems = 10, 
  onItemClick, 
  onFeedback 
}: DailyDigestProps) {
  const [items, setItems] = useState<DailyDigestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memorySDK, setMemorySDK] = useState<MemorySDK | null>(null);
  const { user } = useAuth();

  // Initialize Memory SDK
  useEffect(() => {
    if (!user) return;

    const sdk = new MemorySDK({
      tenantId,
      user: { uid: user.uid }
    });
    setMemorySDK(sdk);
  }, [user, tenantId]);

  // Load personalized digest
  const loadDigest = useCallback(async () => {
    if (!memorySDK || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get user preferences from memory
      const preferences = await memorySDK.recall({
        scope: 'user',
        ownerId: user.uid,
        kind: 'preference',
        tag: 'digest',
        limit: 20
      });

      // Get user goals from memory
      const goals = await memorySDK.recall({
        scope: 'user',
        ownerId: user.uid,
        kind: 'goal',
        limit: 10
      });

      // Generate personalized digest items
      const digestItems = await generatePersonalizedDigest(preferences, goals, user);
      
      setItems(digestItems.slice(0, maxItems));
    } catch (err) {
      setError(`Failed to load daily digest: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [memorySDK, user, maxItems]);

  // Generate personalized digest items
  const generatePersonalizedDigest = async (
    preferences: Memory[], 
    goals: Memory[], 
    user: User
  ): Promise<DailyDigestItem[]> => {
    const items: DailyDigestItem[] = [];

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
    const mockPosts: LocationPost[] = [
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
  const handleFeedback = useCallback(async (item: DailyDigestItem, feedback: 'positive' | 'negative') => {
    if (!memorySDK || !user) return;

    try {
      // Learn from feedback
      const delta = feedback === 'positive' ? 0.3 : -0.2;
      await memorySDK.learn(item.id, 'user', user.uid, {
        delta,
        reason: `User ${feedback} feedback on digest item: ${item.title}`,
        tags: ['digest', 'feedback', feedback]
      });

      // Call parent callback
      onFeedback?.(item, feedback);

      // Reload digest to reflect learning
      await loadDigest();
    } catch (err) {
      console.error('Failed to process feedback:', err);
    }
  }, [memorySDK, user, onFeedback, loadDigest]);

  // Load digest on mount
  useEffect(() => {
    loadDigest();
  }, [loadDigest]);

  if (isLoading) {
    return (
      <div className="daily-digest loading">
        <div className="digest-header">
          <h2>Daily Digest</h2>
          <div className="loading-spinner">Loading personalized content...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-digest error">
        <div className="digest-header">
          <h2>Daily Digest</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-digest">
      <div className="digest-header">
        <h2>Daily Digest</h2>
        <p className="digest-subtitle">Personalized for you based on your preferences and goals</p>
      </div>

      <div className="digest-items">
        {items.map(item => (
          <DigestItem
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
            onFeedback={(feedback) => handleFeedback(item, feedback)}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <p>No personalized content available yet.</p>
          <p>Start using the app to build your personalized digest!</p>
        </div>
      )}
    </div>
  );
}

// Individual digest item component
interface DigestItemProps {
  item: DailyDigestItem;
  onClick: () => void;
  onFeedback: (feedback: 'positive' | 'negative') => void;
}

function DigestItem({ item, onClick, onFeedback }: DigestItemProps) {
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

  return (
    <div className="digest-item" onClick={onClick}>
      <div className="item-header">
        <span className="item-type">{typeIcon[item.type]}</span>
        <span 
          className="item-priority" 
          style={{ backgroundColor: priorityColor[item.priority] }}
        >
          {item.priority}
        </span>
        <span className="item-score">Score: {item.relevanceScore.toFixed(2)}</span>
      </div>

      <h3 className="item-title">{item.title}</h3>
      <p className="item-description">{item.description}</p>

      {item.personalizedReason && (
        <p className="personalized-reason">
          <strong>Why this matters to you:</strong> {item.personalizedReason}
        </p>
      )}

      <div className="item-actions">
        <button 
          className="feedback-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFeedback(!showFeedback);
          }}
        >
          💭
        </button>

        {showFeedback && (
          <div className="feedback-panel">
            <button 
              className="feedback-positive"
              onClick={(e) => {
                e.stopPropagation();
                onFeedback('positive');
                setShowFeedback(false);
              }}
            >
              👍 Helpful
            </button>
            <button 
              className="feedback-negative"
              onClick={(e) => {
                e.stopPropagation();
                onFeedback('negative');
                setShowFeedback(false);
              }}
            >
              👎 Not helpful
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

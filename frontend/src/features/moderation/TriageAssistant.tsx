/* SportBeaconAI - Moderator Triage Assistant
   AI-powered content analysis with automated triage recommendations
*/

import React, { useState, useEffect, useCallback } from 'react';
import { MemorySDK, type Memory, type Feedback } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
import { type LocationPost, type SecurityEvent } from '../../types';

export interface TriageItem {
  id: string;
  type: 'post' | 'comment' | 'user' | 'event';
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  confidence: number;
  suggestedAction: 'approve' | 'reject' | 'review' | 'escalate';
  reasoning: string;
  similarCases?: TriageCase[];
  metadata: Record<string, any>;
  createdAt: string;
}

export interface TriageCase {
  id: string;
  content: string;
  action: 'approve' | 'reject' | 'review' | 'escalate';
  outcome: 'correct' | 'incorrect';
  moderatorId: string;
  timestamp: string;
}

export interface TriageAssistantProps {
  tenantId: string;
  onTriageDecision?: (item: TriageItem, decision: string, reasoning: string) => void;
  onFeedback?: (item: TriageItem, feedback: 'correct' | 'incorrect') => void;
}

export function TriageAssistant({ 
  tenantId, 
  onTriageDecision, 
  onFeedback 
}: TriageAssistantProps) {
  const [items, setItems] = useState<TriageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memorySDK, setMemorySDK] = useState<MemorySDK | null>(null);
  const [selectedItem, setSelectedItem] = useState<TriageItem | null>(null);
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

  // Load triage items
  const loadTriageItems = useCallback(async () => {
    if (!memorySDK || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get moderation patterns from memory
      const patterns = await memorySDK.recall({
        scope: 'agent',
        ownerId: 'moderation-agent',
        kind: 'fact',
        tag: 'moderation-pattern',
        limit: 50
      });

      // Get historical triage decisions
      const decisions = await memorySDK.recall({
        scope: 'agent',
        ownerId: 'moderation-agent',
        kind: 'feedback',
        tag: 'triage-decision',
        limit: 100
      });

      // Generate triage items (in real implementation, these would come from your moderation queue)
      const triageItems = await generateTriageItems(patterns, decisions);
      
      setItems(triageItems);
    } catch (err) {
      setError(`Failed to load triage items: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [memorySDK, user]);

  // Generate triage items with AI analysis
  const generateTriageItems = async (
    patterns: Memory[], 
    decisions: Memory[]
  ): Promise<TriageItem[]> => {
    const items: TriageItem[] = [];

    // Mock content that needs triage
    const mockContent = [
      {
        id: 'triage-1',
        type: 'post' as const,
        content: 'This is a great training session! Really helpful tips.',
        severity: 'low' as const,
        category: 'other' as const,
        confidence: 0.95,
        suggestedAction: 'approve' as const,
        reasoning: 'Positive content with no violations detected',
        metadata: { locationId: 'loc-1', authorId: 'user-1' }
      },
      {
        id: 'triage-2',
        type: 'post' as const,
        content: 'You guys are all losers and this sport is stupid',
        severity: 'high' as const,
        category: 'harassment' as const,
        confidence: 0.88,
        suggestedAction: 'reject' as const,
        reasoning: 'Harassment detected: insulting language targeting users',
        metadata: { locationId: 'loc-2', authorId: 'user-2' }
      },
      {
        id: 'triage-3',
        type: 'post' as const,
        content: 'Check out this amazing deal! 50% off everything!',
        severity: 'medium' as const,
        category: 'spam' as const,
        confidence: 0.75,
        suggestedAction: 'review' as const,
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
  const findSimilarCases = (content: any, decisions: Memory[]): TriageCase[] => {
    // In a real implementation, this would use semantic similarity
    return decisions.slice(0, 3).map(decision => ({
      id: decision.id || 'unknown',
      content: decision.text,
      action: decision.text.includes('approve') ? 'approve' : 'reject',
      outcome: decision.score && decision.score > 0 ? 'correct' : 'incorrect',
      moderatorId: 'moderator-1',
      timestamp: decision.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
  };

  // Enhance reasoning with AI insights
  const enhanceReasoning = (content: any, patterns: Memory[], similarCases: TriageCase[]): string => {
    let reasoning = content.reasoning;

    // Add pattern-based insights
    const relevantPatterns = patterns.filter(p => 
      p.text.toLowerCase().includes(content.category) || 
      p.text.toLowerCase().includes(content.severity)
    );

    if (relevantPatterns.length > 0) {
      reasoning += `\n\nPattern Analysis: ${relevantPatterns[0].text}`;
    }

    // Add similar case insights
    if (similarCases.length > 0) {
      const correctCases = similarCases.filter(c => c.outcome === 'correct').length;
      reasoning += `\n\nSimilar Cases: ${correctCases}/${similarCases.length} similar cases were handled correctly.`;
    }

    return reasoning;
  };

  // Handle triage decision
  const handleTriageDecision = useCallback(async (
    item: TriageItem, 
    decision: 'approve' | 'reject' | 'review' | 'escalate',
    reasoning: string
  ) => {
    if (!memorySDK || !user) return;

    try {
      // Store decision in memory for learning
      await memorySDK.remember({
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
    } catch (err) {
      console.error('Failed to process triage decision:', err);
    }
  }, [memorySDK, user, tenantId, onTriageDecision]);

  // Handle feedback on triage decision
  const handleFeedback = useCallback(async (
    item: TriageItem, 
    feedback: 'correct' | 'incorrect'
  ) => {
    if (!memorySDK || !user) return;

    try {
      // Learn from feedback
      const delta = feedback === 'correct' ? 0.3 : -0.2;
      await memorySDK.learn(item.id, 'agent', 'moderation-agent', {
        delta,
        reason: `Triage decision feedback: ${feedback} for ${item.suggestedAction}`,
        tags: ['triage-feedback', feedback, item.category]
      });

      // Call parent callback
      onFeedback?.(item, feedback);
    } catch (err) {
      console.error('Failed to process feedback:', err);
    }
  }, [memorySDK, user, onFeedback]);

  // Load items on mount
  useEffect(() => {
    loadTriageItems();
  }, [loadTriageItems]);

  if (isLoading) {
    return (
      <div className="triage-assistant loading">
        <div className="triage-header">
          <h2>Moderation Triage Assistant</h2>
          <div className="loading-spinner">Analyzing content...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="triage-assistant error">
        <div className="triage-header">
          <h2>Moderation Triage Assistant</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="triage-assistant">
      <div className="triage-header">
        <h2>Moderation Triage Assistant</h2>
        <p className="triage-subtitle">AI-powered content analysis and triage recommendations</p>
      </div>

      <div className="triage-items">
        {items.map(item => (
          <TriageItem
            key={item.id}
            item={item}
            onDecision={handleTriageDecision}
            onFeedback={handleFeedback}
            onSelect={() => setSelectedItem(item)}
            isSelected={selectedItem?.id === item.id}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <p>No items require triage at this time.</p>
          <p>Great job keeping the community safe!</p>
        </div>
      )}
    </div>
  );
}

// Individual triage item component
interface TriageItemProps {
  item: TriageItem;
  onDecision: (item: TriageItem, decision: string, reasoning: string) => void;
  onFeedback: (item: TriageItem, feedback: 'correct' | 'incorrect') => void;
  onSelect: () => void;
  isSelected: boolean;
}

function TriageItem({ item, onDecision, onFeedback, onSelect, isSelected }: TriageItemProps) {
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

  return (
    <div 
      className={`triage-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="item-header">
        <span className="item-category">{categoryIcon[item.category]} {item.category}</span>
        <span 
          className="item-severity" 
          style={{ backgroundColor: severityColor[item.severity] }}
        >
          {item.severity}
        </span>
        <span className="item-confidence">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
      </div>

      <div className="item-content">
        <p className="content-text">{item.content}</p>
      </div>

      <div className="item-analysis">
        <h4>AI Analysis:</h4>
        <p className="reasoning">{item.reasoning}</p>
        
        <div className="suggested-action">
          <strong>Suggested Action:</strong> {item.suggestedAction}
        </div>
      </div>

      {item.similarCases && item.similarCases.length > 0 && (
        <div className="similar-cases">
          <h4>Similar Cases:</h4>
          {item.similarCases.map(case_ => (
            <div key={case_.id} className="similar-case">
              <span className={`case-outcome ${case_.outcome}`}>
                {case_.outcome === 'correct' ? '✅' : '❌'}
              </span>
              <span className="case-action">{case_.action}</span>
              <span className="case-content">{case_.content.substring(0, 50)}...</span>
            </div>
          ))}
        </div>
      )}

      <div className="item-actions">
        <div className="decision-buttons">
          <button 
            className="decision-button approve"
            onClick={(e) => {
              e.stopPropagation();
              onDecision(item, 'approve', customReasoning || 'Content approved by moderator');
            }}
          >
            ✅ Approve
          </button>
          <button 
            className="decision-button reject"
            onClick={(e) => {
              e.stopPropagation();
              onDecision(item, 'reject', customReasoning || 'Content rejected by moderator');
            }}
          >
            ❌ Reject
          </button>
          <button 
            className="decision-button review"
            onClick={(e) => {
              e.stopPropagation();
              onDecision(item, 'review', customReasoning || 'Content flagged for manual review');
            }}
          >
            👀 Review
          </button>
          <button 
            className="decision-button escalate"
            onClick={(e) => {
              e.stopPropagation();
              onDecision(item, 'escalate', customReasoning || 'Content escalated to senior moderator');
            }}
          >
            🚨 Escalate
          </button>
        </div>

        <div className="custom-reasoning">
          <textarea
            placeholder="Add custom reasoning (optional)"
            value={customReasoning}
            onChange={(e) => setCustomReasoning(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <button 
          className="feedback-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFeedback(!showFeedback);
          }}
        >
          💭 Feedback
        </button>

        {showFeedback && (
          <div className="feedback-panel">
            <button 
              className="feedback-correct"
              onClick={(e) => {
                e.stopPropagation();
                onFeedback(item, 'correct');
                setShowFeedback(false);
              }}
            >
              ✅ Correct
            </button>
            <button 
              className="feedback-incorrect"
              onClick={(e) => {
                e.stopPropagation();
                onFeedback(item, 'incorrect');
                setShowFeedback(false);
              }}
            >
              ❌ Incorrect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

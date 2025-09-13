/* SportBeaconAI - Creator Assist Feature
   AI-powered writing assistance with personal style memory
*/

import React, { useState, useEffect, useCallback } from 'react';
import { MemorySDK, type Memory, type Feedback } from '@sportbeacon/memory-sdk';
import { useAuth } from '../../hooks/useAuth';
import { useComposerAssist } from '../../hooks/useComposerAssist';
import { type User } from '../../types';

export interface CreatorAssistProps {
  tenantId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onStyleUpdate?: (style: any) => void;
}

export interface WritingSuggestion {
  id: string;
  type: 'style' | 'grammar' | 'tone' | 'content' | 'engagement';
  text: string;
  confidence: number;
  reason?: string;
  originalText?: string;
  suggestedText?: string;
}

export interface PersonalStyle {
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  length: 'short' | 'medium' | 'long';
  complexity: 'simple' | 'moderate' | 'complex';
  engagement: 'low' | 'medium' | 'high';
  preferences: string[];
}

export function CreatorAssist({ 
  tenantId, 
  initialContent = '', 
  onContentChange,
  onStyleUpdate 
}: CreatorAssistProps) {
  const [content, setContent] = useState(initialContent);
  const [personalStyle, setPersonalStyle] = useState<PersonalStyle | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [memorySDK, setMemorySDK] = useState<MemorySDK | null>(null);
  const { user } = useAuth();

  // Use the composer assist hook
  const {
    suggestions,
    isLoading,
    error,
    writingStyle,
    generateSuggestions,
    learnFromFeedback,
    updateWritingStyle,
    isEnabled
  } = useComposerAssist({
    tenantId,
    enabled: true,
    maxSuggestions: 8
  });

  // Initialize Memory SDK
  useEffect(() => {
    if (!user) return;

    const sdk = new MemorySDK({
      tenantId,
      user: { uid: user.uid }
    });
    setMemorySDK(sdk);
  }, [user, tenantId]);

  // Load personal style from memory
  const loadPersonalStyle = useCallback(async () => {
    if (!memorySDK || !user) return;

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
    } catch (err) {
      console.warn('Failed to load personal style:', err);
    }
  }, [memorySDK, user, onStyleUpdate]);

  // Aggregate personal style from multiple memories
  const aggregatePersonalStyle = (memories: Memory[]): PersonalStyle => {
    const style: PersonalStyle = {
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
          style.tone = toneMatch[1] as PersonalStyle['tone'];
        }
      }
      
      if (text.includes('length:')) {
        const lengthMatch = text.match(/length:(\w+)/);
        if (lengthMatch) {
          style.length = lengthMatch[1] as PersonalStyle['length'];
        }
      }
      
      if (text.includes('complexity:')) {
        const complexityMatch = text.match(/complexity:(\w+)/);
        if (complexityMatch) {
          style.complexity = complexityMatch[1] as PersonalStyle['complexity'];
        }
      }
      
      if (text.includes('engagement:')) {
        const engagementMatch = text.match(/engagement:(\w+)/);
        if (engagementMatch) {
          style.engagement = engagementMatch[1] as PersonalStyle['engagement'];
        }
      }
      
      style.preferences.push(memory.text);
    });

    return style;
  };

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
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
  const handleSuggestionFeedback = useCallback(async (
    suggestion: WritingSuggestion, 
    feedback: 'positive' | 'negative'
  ) => {
    await learnFromFeedback(suggestion.id, feedback);
  }, [learnFromFeedback]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: WritingSuggestion) => {
    if (suggestion.suggestedText) {
      const newContent = content.replace(suggestion.originalText || '', suggestion.suggestedText);
      handleContentChange(newContent);
    }
  }, [content, handleContentChange]);

  // Update personal style
  const handleStyleUpdate = useCallback(async (newStyle: Partial<PersonalStyle>) => {
    if (!personalStyle) return;

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

  return (
    <div className="creator-assist">
      <div className="assist-header">
        <h2>Creator Assist</h2>
        <p className="assist-subtitle">AI-powered writing assistance with personal style memory</p>
      </div>

      {personalStyle && (
        <div className="personal-style">
          <h3>Your Writing Style</h3>
          <div className="style-indicators">
            <div className="style-indicator">
              <span className="label">Tone:</span>
              <select 
                value={personalStyle.tone} 
                onChange={(e) => handleStyleUpdate({ tone: e.target.value as PersonalStyle['tone'] })}
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            
            <div className="style-indicator">
              <span className="label">Length:</span>
              <select 
                value={personalStyle.length} 
                onChange={(e) => handleStyleUpdate({ length: e.target.value as PersonalStyle['length'] })}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            
            <div className="style-indicator">
              <span className="label">Complexity:</span>
              <select 
                value={personalStyle.complexity} 
                onChange={(e) => handleStyleUpdate({ complexity: e.target.value as PersonalStyle['complexity'] })}
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="content-editor">
        <textarea
          className="content-input"
          placeholder="Start writing your content here..."
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={10}
        />
        
        {isLoading && (
          <div className="analyzing-indicator">
            <span className="spinner">🔄</span>
            Analyzing content...
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-panel">
          <h3>Writing Suggestions</h3>
          <div className="suggestions-list">
            {suggestions.map(suggestion => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onApply={() => applySuggestion(suggestion)}
                onFeedback={(feedback) => handleSuggestionFeedback(suggestion, feedback)}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {content && suggestions.length === 0 && !isLoading && (
        <div className="no-suggestions">
          <p>Great content! No suggestions at this time.</p>
        </div>
      )}
    </div>
  );
}

// Individual suggestion item component
interface SuggestionItemProps {
  suggestion: WritingSuggestion;
  onApply: () => void;
  onFeedback: (feedback: 'positive' | 'negative') => void;
}

function SuggestionItem({ suggestion, onApply, onFeedback }: SuggestionItemProps) {
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

  return (
    <div className="suggestion-item">
      <div className="suggestion-header">
        <span 
          className="suggestion-type"
          style={{ color: typeColor[suggestion.type] }}
        >
          {typeIcon[suggestion.type]} {suggestion.type}
        </span>
        <span className="suggestion-confidence">
          {(suggestion.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="suggestion-content">
        <p className="suggestion-text">{suggestion.text}</p>
        {suggestion.reason && (
          <p className="suggestion-reason">{suggestion.reason}</p>
        )}
        
        {suggestion.suggestedText && (
          <div className="suggestion-preview">
            <div className="original-text">
              <strong>Original:</strong> {suggestion.originalText}
            </div>
            <div className="suggested-text">
              <strong>Suggested:</strong> {suggestion.suggestedText}
            </div>
          </div>
        )}
      </div>

      <div className="suggestion-actions">
        {suggestion.suggestedText && (
          <button 
            className="apply-button"
            onClick={onApply}
          >
            Apply Suggestion
          </button>
        )}
        
        <button 
          className="feedback-button"
          onClick={() => setShowFeedback(!showFeedback)}
        >
          💭
        </button>

        {showFeedback && (
          <div className="feedback-panel">
            <button 
              className="feedback-positive"
              onClick={() => {
                onFeedback('positive');
                setShowFeedback(false);
              }}
            >
              👍 Helpful
            </button>
            <button 
              className="feedback-negative"
              onClick={() => {
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

import React, { useEffect, useState } from 'react';
import RewardCoachStreak from './RewardCoachStreak';
import WearableStatsOverlay from './WearableStatsOverlay';
import VoiceCoachToggle from './VoiceCoachToggle';
import { fetchCoachingRecommendations, playAudioFeedback } from '../services/aiAssistant';

interface PlayerCoachPanelProps {
  playerId: string;
  sport: string;
  walletAddress: string;
  signature: string;
  message: string;
}

const PlayerCoachPanel: React.FC<PlayerCoachPanelProps> = ({ playerId, sport, walletAddress, signature, message }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0.7);
  const [currentVoice, setCurrentVoice] = useState('coach_mike');
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);
  const [wearableConnected, setWearableConnected] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCoachingRecommendations({ playerId, sport, walletAddress, signature, message })
      .then(setData)
      .catch((e) => setError(e.message || 'Error fetching recommendations'))
      .finally(() => setLoading(false));
  }, [playerId, sport, walletAddress, signature, message]);

  // Start live coaching session
  const startSession = () => {
    setIsActive(true);
    setLiveSuggestions([]);
  };

  // Stop live coaching session
  const stopSession = () => {
    setIsActive(false);
    setLiveSuggestions([]);
  };

  // Handle fatigue alerts from wearable
  const handleFatigueAlert = (level: string) => {
    const suggestion = {
      type: 'fatigue_alert',
      message: `High fatigue detected (${level}). Consider reducing intensity or taking a break.`,
      priority: 'high',
      timestamp: new Date().toISOString()
    };
    setLiveSuggestions(prev => [suggestion, ...prev.slice(0, 4)]);
    
    if (voiceEnabled) {
      playAudioFeedback({
        text: suggestion.message,
        voice: currentVoice,
        tone: 'encouraging',
        urgency: 'medium'
      });
    }
  };

  // Handle form alerts from wearable
  const handleFormAlert = (skill: string, score: number) => {
    const suggestion = {
      type: 'form_alert',
      message: `Form alert: ${skill} score is ${Math.round(score * 100)}%. Focus on technique.`,
      priority: 'medium',
      timestamp: new Date().toISOString()
    };
    setLiveSuggestions(prev => [suggestion, ...prev.slice(0, 4)]);
    
    if (voiceEnabled) {
      playAudioFeedback({
        text: suggestion.message,
        voice: currentVoice,
        tone: 'technical',
        urgency: 'medium'
      });
    }
  };

  // Auto-suggest next drill based on current performance
  const suggestNextDrill = () => {
    if (!data || !isActive) return;

    const currentDrills = data.training_plan?.drill_recommendations || [];
    const completedDrills = liveSuggestions.filter(s => s.type === 'drill_completed').length;
    
    if (completedDrills < currentDrills.length) {
      const nextDrill = currentDrills[completedDrills];
      const suggestion = {
        type: 'next_drill',
        drill: nextDrill,
        message: `Next up: ${nextDrill.name}. ${nextDrill.description}`,
        priority: 'normal',
        timestamp: new Date().toISOString()
      };
      setLiveSuggestions(prev => [suggestion, ...prev.slice(0, 4)]);
      
      if (voiceEnabled) {
        playAudioFeedback({
          text: suggestion.message,
          voice: currentVoice,
          tone: 'encouraging',
          urgency: 'low'
        });
      }
    }
  };

  // Mark drill as completed
  const completeDrill = (drillIndex: number) => {
    const suggestion = {
      type: 'drill_completed',
      message: `Great job completing the drill! Keep up the momentum.`,
      priority: 'normal',
      timestamp: new Date().toISOString()
    };
    setLiveSuggestions(prev => [suggestion, ...prev.slice(0, 4)]);
    
    if (voiceEnabled) {
      playAudioFeedback({
        text: suggestion.message,
        voice: currentVoice,
        tone: 'motivational',
        urgency: 'low'
      });
    }
    
    // Suggest next drill after a short delay
    setTimeout(suggestNextDrill, 2000);
  };

  if (loading) return <div>Loading coaching insights...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!data) return null;

  return (
    <div className="player-coach-panel">
      <h2>AI Coaching Insights</h2>
      
      {/* Session Controls */}
      <div className="session-controls">
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`session-button ${isActive ? 'active' : 'inactive'}`}
        >
          {isActive ? '⏹️ Stop Session' : '▶️ Start Session'}
        </button>
        
        <VoiceCoachToggle
          isEnabled={voiceEnabled}
          onToggle={setVoiceEnabled}
          onVolumeChange={setVoiceVolume}
          onVoiceChange={setCurrentVoice}
          currentVolume={voiceVolume}
          currentVoice={currentVoice}
        />
      </div>

      {/* Live Wearable Stats Overlay */}
      {isActive && (
        <WearableStatsOverlay
          walletAddress={walletAddress}
          signature={signature}
          message={message}
          isActive={isActive}
          onFatigueAlert={handleFatigueAlert}
          onFormAlert={handleFormAlert}
        />
      )}

      {/* Live Suggestions Feed */}
      {isActive && (
        <section className="live-suggestions">
          <h3>🔴 Live Coaching Feed</h3>
          <div className="suggestions-list">
            {liveSuggestions.map((suggestion, index) => (
              <div key={index} className={`suggestion-item ${suggestion.priority}`}>
                <div className="suggestion-content">
                  <span className="suggestion-type">{suggestion.type.replace('_', ' ')}</span>
                  <p>{suggestion.message}</p>
                  <span className="suggestion-time">
                    {new Date(suggestion.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {suggestion.type === 'next_drill' && (
                  <button 
                    onClick={() => completeDrill(index)}
                    className="complete-drill-btn"
                  >
                    ✅ Complete
                  </button>
                )}
              </div>
            ))}
            {liveSuggestions.length === 0 && (
              <div className="no-suggestions">
                <p>Start your session to see live coaching suggestions!</p>
                <button onClick={suggestNextDrill} className="suggest-btn">
                  🎯 Suggest First Drill
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Static Coaching Data */}
      <section>
        <h3>Top Weaknesses</h3>
        <ul>
          {data.skill_plans?.map((plan: any) => (
            <li key={plan.skill}>
              <strong>{plan.skill}</strong>: {plan.current_score} → {plan.target_score} (Est. {plan.estimated_time} days)
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Drill Suggestions</h3>
        <ul>
          {data.training_plan?.drill_recommendations?.map((drill: any, i: number) => (
            <li key={i}>
              <div>
                <strong>{drill.name}</strong> ({drill.difficulty})<br />
                {drill.description}<br />
                <button onClick={() => playAudioFeedback(drill)}>🔊 Audio Feedback</button>
                {isActive && (
                  <button 
                    onClick={() => completeDrill(i)}
                    className="complete-btn"
                  >
                    ✅ Complete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Recent Errors & Suggestions</h3>
        <ul>
          {data.past_errors?.map((err: any, i: number) => (
            <li key={i}>
              <strong>{err.error_type}</strong> ({err.frequency}): {err.primary_suggestion}
              <button onClick={() => playAudioFeedback(err)}>🔊</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Highlight Replays</h3>
        <ul>
          {data.highlight_recommendations?.map((rec: any, i: number) => (
            <li key={i}>
              <span>{rec.type === 'improvement' ? '🔻' : '⭐'} {rec.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <RewardCoachStreak rewardProgression={data.reward_progression} streak={data.engagement_streak} />
      
      <section>
        <h3>Badge Progression</h3>
        <div>
          <strong>Current Streak:</strong> {data.engagement_streak} days<br />
          <strong>Reward:</strong> {data.reward_progression?.total_reward} BEACON
        </div>
      </section>

      {/* Session Summary */}
      {isActive && (
        <section className="session-summary">
          <h3>Session Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-label">Drills Completed:</span>
              <span className="stat-value">
                {liveSuggestions.filter(s => s.type === 'drill_completed').length}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Session Duration:</span>
              <span className="stat-value">
                {Math.floor((Date.now() - new Date(liveSuggestions[0]?.timestamp || Date.now()).getTime()) / 60000)} min
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Voice Feedback:</span>
              <span className="stat-value">
                {voiceEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PlayerCoachPanel; 
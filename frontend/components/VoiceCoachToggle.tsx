import React, { useState, useEffect } from 'react';
import { generateCoachingAudio } from '../services/audio_coaching';

interface VoiceCoachToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onVoiceChange?: (voice: string) => void;
  currentVolume?: number;
  currentVoice?: string;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  tone: 'encouraging' | 'technical' | 'motivational' | 'strict';
}

const VoiceCoachToggle: React.FC<VoiceCoachToggleProps> = ({
  isEnabled,
  onToggle,
  onVolumeChange,
  onVoiceChange,
  currentVolume = 0.7,
  currentVoice = 'coach_mike'
}) => {
  const [volume, setVolume] = useState(currentVolume);
  const [selectedVoice, setSelectedVoice] = useState(currentVoice);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const voiceOptions: VoiceOption[] = [
    {
      id: 'coach_mike',
      name: 'Coach Mike',
      description: 'Encouraging and supportive',
      gender: 'male',
      tone: 'encouraging'
    },
    {
      id: 'coach_sarah',
      name: 'Coach Sarah',
      description: 'Technical and detailed',
      gender: 'female',
      tone: 'technical'
    },
    {
      id: 'coach_james',
      name: 'Coach James',
      description: 'Motivational and inspiring',
      gender: 'male',
      tone: 'motivational'
    },
    {
      id: 'coach_lisa',
      name: 'Coach Lisa',
      description: 'Strict and challenging',
      gender: 'female',
      tone: 'strict'
    }
  ];

  const handleToggle = () => {
    onToggle(!isEnabled);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (onVoiceChange) {
      onVoiceChange(voiceId);
    }
  };

  const playTestAudio = async () => {
    if (isTestPlaying) return;

    setIsTestPlaying(true);
    try {
      const testMessage = "Great work! Keep up the momentum and focus on your form.";
      const audioUrl = await generateCoachingAudio({
        text: testMessage,
        voice: selectedVoice,
        tone: voiceOptions.find(v => v.id === selectedVoice)?.tone || 'encouraging'
      });

      // Play audio with current volume
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      await audio.play();
    } catch (error) {
      console.error('Failed to play test audio:', error);
    } finally {
      setIsTestPlaying(false);
    }
  };

  const getSelectedVoiceInfo = () => {
    return voiceOptions.find(v => v.id === selectedVoice);
  };

  return (
    <div className="voice-coach-toggle">
      {/* Main Toggle */}
      <div className="main-toggle">
        <div className="toggle-header">
          <h3>Voice Coach</h3>
          <div className={`toggle-switch ${isEnabled ? 'enabled' : 'disabled'}`}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              id="voice-toggle"
            />
            <label htmlFor="voice-toggle"></label>
          </div>
        </div>
        
        <div className="status-indicator">
          <span className={`status-dot ${isEnabled ? 'active' : 'inactive'}`}></span>
          {isEnabled ? 'Voice feedback enabled' : 'Voice feedback disabled'}
        </div>
      </div>

      {/* Settings Panel */}
      {isEnabled && (
        <div className="settings-panel">
          <button 
            className="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>

          {showSettings && (
            <div className="settings-content">
              {/* Voice Selection */}
              <div className="setting-section">
                <h4>Voice Selection</h4>
                <div className="voice-options">
                  {voiceOptions.map(voice => (
                    <div 
                      key={voice.id}
                      className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''}`}
                      onClick={() => handleVoiceChange(voice.id)}
                    >
                      <div className="voice-info">
                        <div className="voice-name">{voice.name}</div>
                        <div className="voice-description">{voice.description}</div>
                        <div className="voice-tone">{voice.tone}</div>
                      </div>
                      <div className="voice-gender">
                        {voice.gender === 'male' ? '👨' : '👩'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="test-voice-button"
                  onClick={playTestAudio}
                  disabled={isTestPlaying}
                >
                  {isTestPlaying ? 'Playing...' : '🎵 Test Voice'}
                </button>
              </div>

              {/* Volume Control */}
              <div className="setting-section">
                <h4>Volume Control</h4>
                <div className="volume-control">
                  <span className="volume-icon">🔇</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  <span className="volume-icon">🔊</span>
                  <span className="volume-value">{Math.round(volume * 100)}%</span>
                </div>
              </div>

              {/* Voice Preview */}
              <div className="setting-section">
                <h4>Current Voice</h4>
                <div className="voice-preview">
                  <div className="preview-info">
                    <strong>{getSelectedVoiceInfo()?.name}</strong>
                    <p>{getSelectedVoiceInfo()?.description}</p>
                    <span className="tone-badge">{getSelectedVoiceInfo()?.tone}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Types */}
              <div className="setting-section">
                <h4>Feedback Types</h4>
                <div className="feedback-types">
                  <label className="feedback-type">
                    <input type="checkbox" defaultChecked />
                    <span>Drill Instructions</span>
                  </label>
                  <label className="feedback-type">
                    <input type="checkbox" defaultChecked />
                    <span>Form Corrections</span>
                  </label>
                  <label className="feedback-type">
                    <input type="checkbox" defaultChecked />
                    <span>Motivational Messages</span>
                  </label>
                  <label className="feedback-type">
                    <input type="checkbox" defaultChecked />
                    <span>Milestone Celebrations</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action"
          onClick={() => {
            // Mute/unmute quickly
            handleVolumeChange(volume > 0 ? 0 : 0.7);
          }}
        >
          {volume > 0 ? '🔇 Mute' : '🔊 Unmute'}
        </button>
        
        <button 
          className="quick-action"
          onClick={() => {
            // Cycle through voices
            const currentIndex = voiceOptions.findIndex(v => v.id === selectedVoice);
            const nextIndex = (currentIndex + 1) % voiceOptions.length;
            handleVoiceChange(voiceOptions[nextIndex].id);
          }}
        >
          🔄 Next Voice
        </button>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Voice:</span>
          <span className="status-value">{getSelectedVoiceInfo()?.name}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Volume:</span>
          <span className="status-value">{Math.round(volume * 100)}%</span>
        </div>
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className={`status-value ${isEnabled ? 'active' : 'inactive'}`}>
            {isEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCoachToggle; 
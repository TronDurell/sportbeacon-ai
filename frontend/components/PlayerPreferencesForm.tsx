import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PlayerPreferencesFormProps {
  walletAddress: string;
  signature: string;
  message: string;
  onPreferencesSaved?: (preferences: any) => void;
}

const PlayerPreferencesForm: React.FC<PlayerPreferencesFormProps> = ({ 
  walletAddress, 
  signature, 
  message, 
  onPreferencesSaved 
}) => {
  const [preferences, setPreferences] = useState({
    skill_goals: {
      shooting: { target_score: 75, priority: 'medium' },
      dribbling: { target_score: 70, priority: 'medium' },
      passing: { target_score: 70, priority: 'medium' },
      defense: { target_score: 70, priority: 'medium' },
      rebounding: { target_score: 65, priority: 'low' },
      athleticism: { target_score: 70, priority: 'medium' }
    },
    favorite_drills: [],
    injury_data: {
      recent_injuries: [],
      restrictions: [],
      recovery_date: ''
    },
    coach_tone: 'encouraging',
    training_intensity: 'medium',
    preferred_duration: 45,
    rest_days: [],
    notification_preferences: {
      voice_feedback: true,
      streak_reminders: true,
      milestone_alerts: true
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load existing preferences
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get('/api/player/preferences', {
        params: { wallet_address: walletAddress, signature, message }
      });
      
      if (response.data.preferences) {
        setPreferences(prev => ({ ...prev, ...response.data.preferences }));
      }
    } catch (error) {
      console.log('No existing preferences found');
    }
  };

  const handleSkillGoalChange = (skill: string, field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      skill_goals: {
        ...prev.skill_goals,
        [skill]: {
          ...prev.skill_goals[skill],
          [field]: value
        }
      }
    }));
  };

  const handleInjuryDataChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      injury_data: {
        ...prev.injury_data,
        [field]: value
      }
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }));
  };

  const handleRestDayToggle = (day: string) => {
    setPreferences(prev => ({
      ...prev,
      rest_days: prev.rest_days.includes(day)
        ? prev.rest_days.filter(d => d !== day)
        : [...prev.rest_days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/player/preferences', {
        wallet_address: walletAddress,
        signature,
        message,
        preferences
      });

      setSuccess(true);
      if (onPreferencesSaved) {
        onPreferencesSaved(preferences);
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="player-preferences-form">
      <h2>Personalize Your Training</h2>
      
      {success && (
        <div className="success-message">
          ✅ Preferences saved successfully!
        </div>
      )}
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Skill Goals Section */}
        <section>
          <h3>Skill Goals</h3>
          <p>Set target scores and priorities for each skill area</p>
          
          {Object.entries(preferences.skill_goals).map(([skill, goal]) => (
            <div key={skill} className="skill-goal">
              <label>
                <strong>{skill.charAt(0).toUpperCase() + skill.slice(1)}</strong>
              </label>
              <div className="goal-inputs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={goal.target_score}
                  onChange={(e) => handleSkillGoalChange(skill, 'target_score', parseInt(e.target.value))}
                  placeholder="Target Score"
                />
                <select
                  value={goal.priority}
                  onChange={(e) => handleSkillGoalChange(skill, 'priority', e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          ))}
        </section>

        {/* Coach Tone Section */}
        <section>
          <h3>Coach Style</h3>
          <div className="coach-tone">
            <label>Preferred Coach Tone:</label>
            <select
              value={preferences.coach_tone}
              onChange={(e) => setPreferences(prev => ({ ...prev, coach_tone: e.target.value }))}
            >
              <option value="encouraging">Encouraging & Supportive</option>
              <option value="technical">Technical & Detailed</option>
              <option value="motivational">Motivational & Inspiring</option>
              <option value="strict">Strict & Challenging</option>
            </select>
          </div>

          <div className="training-intensity">
            <label>Training Intensity:</label>
            <select
              value={preferences.training_intensity}
              onChange={(e) => setPreferences(prev => ({ ...prev, training_intensity: e.target.value }))}
            >
              <option value="low">Low - Focus on Form</option>
              <option value="medium">Medium - Balanced</option>
              <option value="high">High - Performance</option>
            </select>
          </div>

          <div className="preferred-duration">
            <label>Preferred Session Duration (minutes):</label>
            <input
              type="number"
              min="15"
              max="120"
              value={preferences.preferred_duration}
              onChange={(e) => setPreferences(prev => ({ ...prev, preferred_duration: parseInt(e.target.value) }))}
            />
          </div>
        </section>

        {/* Rest Days Section */}
        <section>
          <h3>Rest Days</h3>
          <p>Select your preferred rest days:</p>
          <div className="rest-days">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <label key={day} className="rest-day-checkbox">
                <input
                  type="checkbox"
                  checked={preferences.rest_days.includes(day)}
                  onChange={() => handleRestDayToggle(day)}
                />
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </label>
            ))}
          </div>
        </section>

        {/* Injury Data Section */}
        <section>
          <h3>Injury & Health Information</h3>
          <div className="injury-data">
            <div>
              <label>Recent Injuries (comma-separated):</label>
              <input
                type="text"
                value={preferences.injury_data.recent_injuries.join(', ')}
                onChange={(e) => handleInjuryDataChange('recent_injuries', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                placeholder="e.g., ankle sprain, knee strain"
              />
            </div>
            
            <div>
              <label>Current Restrictions (comma-separated):</label>
              <input
                type="text"
                value={preferences.injury_data.restrictions.join(', ')}
                onChange={(e) => handleInjuryDataChange('restrictions', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                placeholder="e.g., no high impact, limited jumping"
              />
            </div>
            
            <div>
              <label>Recovery Date:</label>
              <input
                type="date"
                value={preferences.injury_data.recovery_date}
                onChange={(e) => handleInjuryDataChange('recovery_date', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section>
          <h3>Notification Preferences</h3>
          <div className="notification-preferences">
            <label className="notification-checkbox">
              <input
                type="checkbox"
                checked={preferences.notification_preferences.voice_feedback}
                onChange={(e) => handleNotificationChange('voice_feedback', e.target.checked)}
              />
              Voice Feedback During Drills
            </label>
            
            <label className="notification-checkbox">
              <input
                type="checkbox"
                checked={preferences.notification_preferences.streak_reminders}
                onChange={(e) => handleNotificationChange('streak_reminders', e.target.checked)}
              />
              Streak Reminders
            </label>
            
            <label className="notification-checkbox">
              <input
                type="checkbox"
                checked={preferences.notification_preferences.milestone_alerts}
                onChange={(e) => handleNotificationChange('milestone_alerts', e.target.checked)}
              />
              Milestone Achievement Alerts
            </label>
          </div>
        </section>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default PlayerPreferencesForm; 
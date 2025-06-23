import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface WearableStatsOverlayProps {
  walletAddress: string;
  signature: string;
  message: string;
  isActive: boolean;
  onFatigueAlert?: (level: string) => void;
  onFormAlert?: (skill: string, score: number) => void;
}

interface WearableData {
  heart_rate: {
    current: number;
    average: number;
    max: number;
    resting: number;
  };
  jump_count: number;
  jump_height: {
    average: number;
    max: number;
    units: string;
  };
  movement_data: {
    steps: number;
    distance: number;
    calories: number;
    active_time: number;
  };
  fatigue_metrics: {
    muscle_fatigue: number;
    cardio_fatigue: number;
    overall_fatigue: number;
  };
  form_metrics: {
    shooting_form: number;
    dribbling_form: number;
    passing_form: number;
  };
  device_info: {
    device_type: string;
    model: string;
    battery_level: number;
  };
  timestamp: string;
}

const WearableStatsOverlay: React.FC<WearableStatsOverlayProps> = ({
  walletAddress,
  signature,
  message,
  isActive,
  onFatigueAlert,
  onFormAlert
}) => {
  const [wearableData, setWearableData] = useState<WearableData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const statusInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startRealTimeSync();
      checkConnectionStatus();
    } else {
      stopRealTimeSync();
    }

    return () => {
      stopRealTimeSync();
    };
  }, [isActive]);

  const startRealTimeSync = () => {
    // Sync wearable data every 30 seconds
    syncInterval.current = setInterval(syncWearableData, 30000);
    
    // Check connection status every 10 seconds
    statusInterval.current = setInterval(checkConnectionStatus, 10000);
    
    // Initial sync
    syncWearableData();
  };

  const stopRealTimeSync = () => {
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
      syncInterval.current = null;
    }
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }
  };

  const syncWearableData = async () => {
    try {
      // Mock wearable data for demonstration
      const mockData: WearableData = {
        heart_rate: {
          current: Math.floor(Math.random() * 40) + 120, // 120-160 bpm
          average: 140,
          max: 180,
          resting: 65
        },
        jump_count: Math.floor(Math.random() * 10) + 20, // 20-30 jumps
        jump_height: {
          average: 0.7 + Math.random() * 0.6, // 0.7-1.3 meters
          max: 1.2,
          units: 'meters'
        },
        movement_data: {
          steps: Math.floor(Math.random() * 500) + 1000, // 1000-1500 steps
          distance: 2.0 + Math.random() * 1.5, // 2.0-3.5 km
          calories: 400 + Math.random() * 200, // 400-600 calories
          active_time: 40 + Math.random() * 20 // 40-60 minutes
        },
        fatigue_metrics: {
          muscle_fatigue: Math.random() * 0.8, // 0-0.8
          cardio_fatigue: Math.random() * 0.7, // 0-0.7
          overall_fatigue: Math.random() * 0.75 // 0-0.75
        },
        form_metrics: {
          shooting_form: 0.7 + Math.random() * 0.3, // 0.7-1.0
          dribbling_form: 0.6 + Math.random() * 0.4, // 0.6-1.0
          passing_form: 0.75 + Math.random() * 0.25 // 0.75-1.0
        },
        device_info: {
          device_type: 'smart_watch',
          model: 'Apple Watch Series 8',
          battery_level: 0.75
        },
        timestamp: new Date().toISOString()
      };

      // Send to backend
      await axios.post('/api/wearables/sync', {
        wallet_address: walletAddress,
        signature,
        message,
        sensor_data: mockData
      });

      setWearableData(mockData);
      setLastSync(new Date().toISOString());
      setIsConnected(true);
      setError(null);

      // Check for alerts
      checkFatigueAlerts(mockData);
      checkFormAlerts(mockData);

    } catch (error: any) {
      setError('Failed to sync wearable data');
      setIsConnected(false);
      console.error('Wearable sync error:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await axios.get('/api/wearables/status', {
        params: { wallet_address: walletAddress, signature, message }
      });
      
      setIsConnected(response.data.connected);
      if (response.data.last_sync) {
        setLastSync(response.data.last_sync);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const checkFatigueAlerts = (data: WearableData) => {
    const fatigue = data.fatigue_metrics.overall_fatigue;
    
    if (fatigue > 0.7 && onFatigueAlert) {
      onFatigueAlert('high');
    } else if (fatigue > 0.5 && onFatigueAlert) {
      onFatigueAlert('medium');
    }
  };

  const checkFormAlerts = (data: WearableData) => {
    const formMetrics = data.form_metrics;
    
    Object.entries(formMetrics).forEach(([skill, score]) => {
      if (score < 0.6 && onFormAlert) {
        onFormAlert(skill, score);
      }
    });
  };

  const getFatigueColor = (fatigue: number) => {
    if (fatigue > 0.7) return '#ff4444'; // Red
    if (fatigue > 0.5) return '#ffaa00'; // Orange
    return '#44ff44'; // Green
  };

  const getHeartRateColor = (hr: number) => {
    if (hr > 160) return '#ff4444'; // Red
    if (hr > 140) return '#ffaa00'; // Orange
    return '#44ff44'; // Green
  };

  if (!isActive) return null;

  return (
    <div className="wearable-stats-overlay">
      {/* Connection Status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {isConnected ? 'Connected' : 'Disconnected'}
        {lastSync && (
          <span className="last-sync">
            Last sync: {new Date(lastSync).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Stats Display */}
      <div className="main-stats">
        {wearableData && (
          <>
            {/* Heart Rate */}
            <div className="stat-card heart-rate">
              <div className="stat-icon">❤️</div>
              <div className="stat-value" style={{ color: getHeartRateColor(wearableData.heart_rate.current) }}>
                {wearableData.heart_rate.current}
              </div>
              <div className="stat-label">BPM</div>
            </div>

            {/* Jump Count */}
            <div className="stat-card jump-count">
              <div className="stat-icon">🏃</div>
              <div className="stat-value">{wearableData.jump_count}</div>
              <div className="stat-label">Jumps</div>
            </div>

            {/* Fatigue Level */}
            <div className="stat-card fatigue">
              <div className="stat-icon">⚡</div>
              <div className="stat-value" style={{ color: getFatigueColor(wearableData.fatigue_metrics.overall_fatigue) }}>
                {Math.round(wearableData.fatigue_metrics.overall_fatigue * 100)}%
              </div>
              <div className="stat-label">Fatigue</div>
            </div>

            {/* Form Score */}
            <div className="stat-card form-score">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">
                {Math.round(Object.values(wearableData.form_metrics).reduce((a, b) => a + b, 0) / Object.keys(wearableData.form_metrics).length * 100)}%
              </div>
              <div className="stat-label">Form</div>
            </div>
          </>
        )}
      </div>

      {/* Toggle Details */}
      <button 
        className="details-toggle"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Detailed Stats */}
      {showDetails && wearableData && (
        <div className="detailed-stats">
          <div className="stats-grid">
            {/* Heart Rate Details */}
            <div className="detail-section">
              <h4>Heart Rate</h4>
              <div className="detail-item">
                <span>Current:</span>
                <span style={{ color: getHeartRateColor(wearableData.heart_rate.current) }}>
                  {wearableData.heart_rate.current} BPM
                </span>
              </div>
              <div className="detail-item">
                <span>Average:</span>
                <span>{wearableData.heart_rate.average} BPM</span>
              </div>
              <div className="detail-item">
                <span>Max:</span>
                <span>{wearableData.heart_rate.max} BPM</span>
              </div>
            </div>

            {/* Movement Details */}
            <div className="detail-section">
              <h4>Movement</h4>
              <div className="detail-item">
                <span>Steps:</span>
                <span>{wearableData.movement_data.steps.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span>Distance:</span>
                <span>{wearableData.movement_data.distance.toFixed(1)} km</span>
              </div>
              <div className="detail-item">
                <span>Calories:</span>
                <span>{wearableData.movement_data.calories}</span>
              </div>
            </div>

            {/* Form Details */}
            <div className="detail-section">
              <h4>Form Metrics</h4>
              {Object.entries(wearableData.form_metrics).map(([skill, score]) => (
                <div key={skill} className="detail-item">
                  <span>{skill.charAt(0).toUpperCase() + skill.slice(1)}:</span>
                  <span style={{ color: score < 0.7 ? '#ff4444' : '#44ff44' }}>
                    {Math.round(score * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Device Info */}
            <div className="detail-section">
              <h4>Device</h4>
              <div className="detail-item">
                <span>Battery:</span>
                <span style={{ color: wearableData.device_info.battery_level < 0.2 ? '#ff4444' : '#44ff44' }}>
                  {Math.round(wearableData.device_info.battery_level * 100)}%
                </span>
              </div>
              <div className="detail-item">
                <span>Model:</span>
                <span>{wearableData.device_info.model}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* AR Integration Hook */}
      <div className="ar-integration">
        <button 
          className="ar-toggle"
          onClick={() => {
            // Placeholder for AR/Unreal Engine integration
            console.log('Toggle AR overlay');
          }}
        >
          🥽 AR Overlay
        </button>
      </div>
    </div>
  );
};

export default WearableStatsOverlay; 
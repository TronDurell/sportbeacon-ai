import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/contexts/AdminAuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Remove problematic imports and create simple interfaces
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  message: string;
}

interface QAIssue {
  id: string;
  type: string;
  description: string;
}

interface VideoNotesProps {
  playerId?: string;
  onHealthCheck: () => Promise<HealthCheckResult>;
  onIssueReport: (issue: QAIssue) => Promise<void>;
}

export const VideoNotes: React.FC<VideoNotesProps> = ({ 
  playerId, 
  onHealthCheck, 
  onIssueReport 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.uid) return;
      
      try {
        await updateDoc(doc(db, 'profiles', user.uid), {
          lastViewed: new Date()
        });
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    };

    checkAccess();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const checkPlayerAccess = async () => {
      if (!user?.uid) return;
      
      if (isPlayer && playerId !== user?.uid) {
        router.push('/unauthorized');
      }
    };

    checkPlayerAccess();
  }, [loading, isPlayer, playerId, router]);

  // Simplified chart data
  const chartData = {
    earnings: {
      timeline: [
        { date: '2024-01', amount: 100 },
        { date: '2024-02', amount: 150 },
        { date: '2024-03', amount: 200 }
      ],
      weeklyTips: [
        { date: 'Week 1', count: 5 },
        { date: 'Week 2', count: 8 },
        { date: 'Week 3', count: 12 }
      ]
    },
    referrals: {
      distribution: [
        { tier: 'Bronze', count: 10 },
        { tier: 'Silver', count: 5 },
        { tier: 'Gold', count: 2 }
      ]
    }
  };

  const timelineLabels = chartData.earnings.timeline.map(p => p.date);
  const timelineData = chartData.earnings.timeline.map(p => p.amount);
  
  const weeklyLabels = chartData.earnings.weeklyTips.map(p => p.date);
  const weeklyData = chartData.earnings.weeklyTips.map(p => p.count);
  
  const referralLabels = chartData.referrals.distribution.map(p => p.tier);
  const referralData = chartData.referrals.distribution.map(p => p.count);

  return (
    <div className="video-notes-container">
      <div className="header">
        <h1>Video Notes</h1>
        <button 
          className="chat-button"
          onClick={() => console.log('Chat clicked')}
        >
          Chat
        </button>
      </div>

      <div className="content">
        <div className="stats-section">
          <h2>Performance Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Recent Drills</h3>
              <p>5 completed this week</p>
            </div>
            <div className="stat-card">
              <h3>Improvement</h3>
              <p>+15% accuracy</p>
            </div>
          </div>
        </div>

        <div className="referrals-section">
          <h2>Referral Distribution</h2>
          <div className="referral-tiers">
            {chartData.referrals.distribution.map(tier => (
              <div key={tier.tier} className="tier-card">
                <h3>{tier.tier}</h3>
                <p>{tier.count} referrals</p>
                <div 
                  className="tier-color"
                  style={{ 
                    backgroundColor: tier.tier === 'Gold' ? '#FFD700' : 
                                   tier.tier === 'Silver' ? '#C0C0C0' : '#CD7F32'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
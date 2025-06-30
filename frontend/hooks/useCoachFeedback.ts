import { useState, useEffect } from 'react';
import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

export interface SessionData {
  id: string;
  drillType: string;
  avgScore: number;
  totalShots: number;
  scores: number[];
  shotDetails?: ShotDetail[];
  date: Date;
  sessionDuration: number;
  feedback: string[];
}

export interface ShotDetail {
  score: number;
  modelConfidence: number;
  muzzleDrift: number;
  userCorrected: boolean;
  timestamp: Date;
}

export interface CoachFeedback {
  summary: string;
  ttsReady: string;
  trends: {
    accuracy: 'improving' | 'declining' | 'stable';
    consistency: 'improving' | 'declining' | 'stable';
    speed: 'improving' | 'declining' | 'stable';
  };
  recommendations: string[];
  nextDrill: {
    drillId: string;
    drillName: string;
    reason: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  confidence: number;
  generatedAt: Date;
}

export interface NextDrill {
  drillId: string;
  drillName: string;
  reason: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  targetScore: number;
  focusAreas: string[];
  createdAt: Date;
}

export function useCoachFeedback() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Listen to last 5 sessions
    const sessionsRef = collection(firestore, 'range_sessions');
    const q = query(
      sessionsRef,
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessionData: SessionData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessionData.push({
          id: doc.id,
          drillType: data.drillType,
          avgScore: data.avgScore || 0,
          totalShots: data.totalShots || 0,
          scores: data.scores || [],
          shotDetails: data.shotDetails || [],
          date: data.date.toDate(),
          sessionDuration: data.sessionDuration || 0,
          feedback: data.feedback || []
        });
      });

      setSessions(sessionData);
      
      // Generate feedback if we have sessions
      if (sessionData.length > 0) {
        generateCoachFeedback(sessionData);
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to sessions:', error);
      setError('Failed to load session data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const generateCoachFeedback = async (sessionData: SessionData[]) => {
    try {
      setLoading(true);
      setError(null);

      // Analyze trends
      const trends = analyzeTrends(sessionData);
      
      // Generate AI feedback using OpenAI
      const aiFeedback = await generateAIFeedback(sessionData, trends);
      
      // Determine next drill
      const nextDrill = determineNextDrill(sessionData, trends);
      
      // Create feedback object
      const coachFeedback: CoachFeedback = {
        summary: aiFeedback.summary,
        ttsReady: aiFeedback.ttsReady,
        trends,
        recommendations: aiFeedback.recommendations,
        nextDrill,
        confidence: aiFeedback.confidence,
        generatedAt: new Date()
      };

      setFeedback(coachFeedback);

      // Save next drill to Firestore
      await saveNextDrill(user!.uid, nextDrill);

      // Track analytics
      await analytics.track('coach_feedback_generated', {
        userId: user!.uid,
        sessionCount: sessionData.length,
        avgScore: sessionData.reduce((sum, s) => sum + s.avgScore, 0) / sessionData.length,
        trends: trends,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to generate coach feedback:', error);
      setError('Failed to generate feedback');
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrends = (sessionData: SessionData[]): CoachFeedback['trends'] => {
    if (sessionData.length < 2) {
      return {
        accuracy: 'stable',
        consistency: 'stable',
        speed: 'stable'
      };
    }

    // Calculate accuracy trend
    const accuracyScores = sessionData.map(s => s.avgScore);
    const accuracyTrend = calculateTrend(accuracyScores);

    // Calculate consistency trend (standard deviation)
    const consistencyScores = sessionData.map(s => {
      if (s.scores.length === 0) return 0;
      const mean = s.scores.reduce((sum, score) => sum + score, 0) / s.scores.length;
      const variance = s.scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / s.scores.length;
      return Math.sqrt(variance);
    });
    const consistencyTrend = calculateTrend(consistencyScores, true); // Lower is better

    // Calculate speed trend (session duration vs shots)
    const speedScores = sessionData.map(s => s.totalShots / (s.sessionDuration / 60000)); // shots per minute
    const speedTrend = calculateTrend(speedScores);

    return {
      accuracy: accuracyTrend,
      consistency: consistencyTrend,
      speed: speedTrend
    };
  };

  const calculateTrend = (values: number[], lowerIsBetter = false): 'improving' | 'declining' | 'stable' => {
    if (values.length < 2) return 'stable';

    const recent = values.slice(0, Math.ceil(values.length / 2));
    const older = values.slice(Math.ceil(values.length / 2));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    const threshold = Math.max(1, Math.abs(olderAvg) * 0.05); // 5% threshold

    if (lowerIsBetter) {
      if (change < -threshold) return 'improving';
      if (change > threshold) return 'declining';
    } else {
      if (change > threshold) return 'improving';
      if (change < -threshold) return 'declining';
    }
    
    return 'stable';
  };

  const generateAIFeedback = async (sessionData: SessionData[], trends: any): Promise<any> => {
    try {
      // Prepare session summary for AI
      const sessionSummary = sessionData.map(session => ({
        drillType: session.drillType,
        avgScore: session.avgScore,
        totalShots: session.totalShots,
        date: session.date.toISOString().split('T')[0],
        feedback: session.feedback
      }));

      const prompt = `
        Analyze this shooting session data and provide personalized coaching feedback:
        
        Sessions: ${JSON.stringify(sessionSummary)}
        Trends: ${JSON.stringify(trends)}
        
        Provide:
        1. A concise summary (2-3 sentences)
        2. TTS-ready feedback (1 sentence, natural speech)
        3. 3 specific recommendations
        4. Confidence score (0-1)
        
        Format as JSON:
        {
          "summary": "...",
          "ttsReady": "...",
          "recommendations": ["...", "...", "..."],
          "confidence": 0.85
        }
      `;

      // Call OpenAI API
      const response = await fetch('/api/openai/coach-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('OpenAI API call failed');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback feedback
      return {
        summary: "Based on your recent sessions, you're showing consistent improvement. Keep focusing on fundamentals.",
        ttsReady: "Great work on your recent sessions. Continue practicing with focus on consistency.",
        recommendations: [
          "Practice breathing control during trigger press",
          "Work on sight alignment consistency",
          "Focus on smooth trigger pull"
        ],
        confidence: 0.7
      };
    }
  };

  const determineNextDrill = (sessionData: SessionData[], trends: any): NextDrill => {
    const recentSessions = sessionData.slice(0, 3);
    const avgScore = recentSessions.reduce((sum, s) => sum + s.avgScore, 0) / recentSessions.length;
    
    // Determine difficulty based on performance
    let difficulty: 'beginner' | 'intermediate' | 'advanced';
    if (avgScore >= 90) difficulty = 'advanced';
    else if (avgScore >= 75) difficulty = 'intermediate';
    else difficulty = 'beginner';

    // Select drill based on trends and performance
    let drillId = 'precision_drill';
    let drillName = '5x5 Precision Drill';
    let reason = 'Focus on accuracy and consistency';
    let focusAreas = ['accuracy', 'consistency'];

    if (trends.accuracy === 'declining') {
      drillId = 'slow_fire';
      drillName = 'Slow Fire Practice';
      reason = 'Improve accuracy fundamentals';
      focusAreas = ['accuracy', 'fundamentals'];
    } else if (trends.consistency === 'declining') {
      drillId = 'controlled_pair';
      drillName = 'Controlled Pair';
      reason = 'Build consistency in timing';
      focusAreas = ['consistency', 'timing'];
    } else if (trends.speed === 'declining') {
      drillId = 'draw_fire';
      drillName = 'Draw & Fire 1';
      reason = 'Improve reaction time and speed';
      focusAreas = ['speed', 'reaction'];
    }

    return {
      drillId,
      drillName,
      reason,
      difficulty,
      estimatedDuration: 15, // minutes
      targetScore: Math.min(100, avgScore + 5),
      focusAreas,
      createdAt: new Date()
    };
  };

  const saveNextDrill = async (uid: string, nextDrill: NextDrill): Promise<void> => {
    try {
      const coachPlanRef = doc(firestore, 'users', uid, 'coach_plan', 'nextDrill');
      await setDoc(coachPlanRef, nextDrill);
    } catch (error) {
      console.error('Failed to save next drill:', error);
    }
  };

  const refreshFeedback = () => {
    if (sessions.length > 0) {
      generateCoachFeedback(sessions);
    }
  };

  return {
    sessions,
    feedback,
    loading,
    error,
    refreshFeedback
  };
} 
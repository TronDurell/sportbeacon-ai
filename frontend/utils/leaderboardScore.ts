import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { analytics } from '../../lib/ai/shared/analytics';

export interface LeaderboardScore {
  uid: string;
  compositeScore: number;
  avgScore: number;
  consistency: number;
  improvementRate: number;
  lastUpdated: Date;
  sessionCount: number;
  rank?: number;
}

export interface RangeSession {
  id: string;
  uid: string;
  avgScore: number;
  scores: number[];
  date: Date;
  drillType: string;
}

/**
 * Calculate composite score for leaderboard ranking
 */
export async function calculateCompositeScore(uid: string): Promise<number> {
  try {
    // Get last 10 sessions
    const sessionsRef = collection(firestore, 'range_sessions');
    const q = query(
      sessionsRef,
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    const sessions: RangeSession[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        uid: data.uid,
        avgScore: data.avgScore || 0,
        scores: data.scores || [],
        date: data.date.toDate(),
        drillType: data.drillType
      });
    });

    if (sessions.length === 0) {
      return 0;
    }

    // Calculate components
    const avgScore = calculateAverageScore(sessions);
    const consistency = calculateConsistency(sessions);
    const improvementRate = calculateImprovementRate(sessions);

    // Apply weights
    const compositeScore = (avgScore * 0.5) + (consistency * 0.25) + (improvementRate * 0.25);

    // Save to leaderboard collection
    await saveLeaderboardScore(uid, {
      uid,
      compositeScore: Math.round(compositeScore * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      lastUpdated: new Date(),
      sessionCount: sessions.length
    });

    // Track analytics
    await analytics.track('leaderboard_score_calculated', {
      userId: uid,
      compositeScore: Math.round(compositeScore * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      sessionCount: sessions.length,
      timestamp: new Date().toISOString()
    });

    return Math.round(compositeScore * 100) / 100;

  } catch (error) {
    console.error('Failed to calculate composite score:', error);
    return 0;
  }
}

/**
 * Calculate average score component (50% weight)
 */
function calculateAverageScore(sessions: RangeSession[]): number {
  if (sessions.length === 0) return 0;

  const totalScore = sessions.reduce((sum, session) => sum + session.avgScore, 0);
  return totalScore / sessions.length;
}

/**
 * Calculate consistency component (25% weight)
 * Based on standard deviation - lower deviation = higher consistency
 */
function calculateConsistency(sessions: RangeSession[]): number {
  if (sessions.length < 2) return 75; // Default consistency for single session

  // Calculate overall mean
  const allScores = sessions.flatMap(session => session.scores);
  if (allScores.length === 0) return 75;

  const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  
  // Calculate standard deviation
  const variance = allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  // Max deviation of 20 points = 0 consistency, 0 deviation = 100 consistency
  const maxDeviation = 20;
  const consistency = Math.max(0, 100 - (standardDeviation / maxDeviation) * 100);
  
  return Math.round(consistency * 100) / 100;
}

/**
 * Calculate improvement rate component (25% weight)
 */
function calculateImprovementRate(sessions: RangeSession[]): number {
  if (sessions.length < 2) return 0;

  // Split sessions into recent and older halves
  const midPoint = Math.floor(sessions.length / 2);
  const recentSessions = sessions.slice(0, midPoint);
  const olderSessions = sessions.slice(midPoint);

  const recentAvg = recentSessions.reduce((sum, session) => sum + session.avgScore, 0) / recentSessions.length;
  const olderAvg = olderSessions.reduce((sum, session) => sum + session.avgScore, 0) / olderSessions.length;

  // Calculate improvement percentage
  const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  // Cap improvement at ±20% to prevent extreme values
  const cappedImprovement = Math.max(-20, Math.min(20, improvement));
  
  // Convert to 0-100 scale where 0 = -20% improvement, 100 = +20% improvement
  const improvementScore = ((cappedImprovement + 20) / 40) * 100;
  
  return Math.round(improvementScore * 100) / 100;
}

/**
 * Save leaderboard score to Firestore
 */
async function saveLeaderboardScore(uid: string, score: LeaderboardScore): Promise<void> {
  try {
    const leaderboardRef = doc(firestore, 'leaderboard_scores', uid);
    await setDoc(leaderboardRef, score);
  } catch (error) {
    console.error('Failed to save leaderboard score:', error);
  }
}

/**
 * Get leaderboard rankings
 */
export async function getLeaderboardRankings(limit: number = 50): Promise<LeaderboardScore[]> {
  try {
    const leaderboardRef = collection(firestore, 'leaderboard_scores');
    const q = query(
      leaderboardRef,
      orderBy('compositeScore', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    const rankings: LeaderboardScore[] = [];
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      rankings.push({
        ...data,
        rank: index + 1
      } as LeaderboardScore);
    });

    return rankings;
  } catch (error) {
    console.error('Failed to get leaderboard rankings:', error);
    return [];
  }
}

/**
 * Get user's leaderboard position
 */
export async function getUserLeaderboardPosition(uid: string): Promise<number | null> {
  try {
    const userScore = await getUserLeaderboardScore(uid);
    if (!userScore) return null;

    const rankings = await getLeaderboardRankings(1000); // Get all rankings
    const userRank = rankings.find(score => score.uid === uid);
    
    return userRank?.rank || null;
  } catch (error) {
    console.error('Failed to get user leaderboard position:', error);
    return null;
  }
}

/**
 * Get user's leaderboard score
 */
export async function getUserLeaderboardScore(uid: string): Promise<LeaderboardScore | null> {
  try {
    const leaderboardRef = doc(firestore, 'leaderboard_scores', uid);
    const scoreDoc = await getDoc(leaderboardRef);
    
    if (scoreDoc.exists()) {
      return scoreDoc.data() as LeaderboardScore;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user leaderboard score:', error);
    return null;
  }
}

/**
 * Update all leaderboard scores (for admin use)
 */
export async function updateAllLeaderboardScores(): Promise<void> {
  try {
    console.log('Starting leaderboard score update...');
    
    // Get all users with recent activity
    const sessionsRef = collection(firestore, 'range_sessions');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      sessionsRef,
      where('date', '>=', thirtyDaysAgo),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const userSessions: { [uid: string]: RangeSession[] } = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const session: RangeSession = {
        id: doc.id,
        uid: data.uid,
        avgScore: data.avgScore || 0,
        scores: data.scores || [],
        date: data.date.toDate(),
        drillType: data.drillType
      };
      
      if (!userSessions[data.uid]) {
        userSessions[data.uid] = [];
      }
      userSessions[data.uid].push(session);
    });

    // Calculate scores for each user
    const updatePromises = Object.keys(userSessions).map(async (uid) => {
      const userSessionList = userSessions[uid].slice(0, 10); // Last 10 sessions
      if (userSessionList.length === 0) return;

      const avgScore = calculateAverageScore(userSessionList);
      const consistency = calculateConsistency(userSessionList);
      const improvementRate = calculateImprovementRate(userSessionList);
      const compositeScore = (avgScore * 0.5) + (consistency * 0.25) + (improvementRate * 0.25);

      const score: LeaderboardScore = {
        uid,
        compositeScore: Math.round(compositeScore * 100) / 100,
        avgScore: Math.round(avgScore * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        improvementRate: Math.round(improvementRate * 100) / 100,
        lastUpdated: new Date(),
        sessionCount: userSessionList.length
      };

      await saveLeaderboardScore(uid, score);
    });

    await Promise.all(updatePromises);
    console.log(`Updated leaderboard scores for ${Object.keys(userSessions).length} users`);

  } catch (error) {
    console.error('Failed to update all leaderboard scores:', error);
    throw error;
  }
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(): Promise<{
  totalUsers: number;
  averageScore: number;
  topScore: number;
  lastUpdated: Date;
}> {
  try {
    const rankings = await getLeaderboardRankings(1000);
    
    if (rankings.length === 0) {
      return {
        totalUsers: 0,
        averageScore: 0,
        topScore: 0,
        lastUpdated: new Date()
      };
    }

    const totalUsers = rankings.length;
    const averageScore = rankings.reduce((sum, score) => sum + score.compositeScore, 0) / totalUsers;
    const topScore = rankings[0]?.compositeScore || 0;
    const lastUpdated = rankings[0]?.lastUpdated || new Date();

    return {
      totalUsers,
      averageScore: Math.round(averageScore * 100) / 100,
      topScore: Math.round(topScore * 100) / 100,
      lastUpdated
    };
  } catch (error) {
    console.error('Failed to get leaderboard stats:', error);
    return {
      totalUsers: 0,
      averageScore: 0,
      topScore: 0,
      lastUpdated: new Date()
    };
  }
} 
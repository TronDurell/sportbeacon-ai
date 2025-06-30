import { firestore } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface SkillGraph {
  shooting_accuracy: number;
  footwork_agility: number;
  vertical_jump: number;
  consistency: 'low' | 'medium' | 'high';
  reaction_time: number;
  endurance: number;
  mental_focus: number;
  lastUpdated: Date;
  sessionCount: number;
  improvementRate: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface RangeSession {
  id: string;
  uid: string;
  drillType: string;
  avgScore: number;
  totalShots: number;
  scores: number[];
  sessionDuration: number;
  shotDetails?: ShotDetail[];
  date: Date;
}

export interface ShotDetail {
  score: number;
  modelConfidence: number;
  muzzleDrift: number;
  userCorrected: boolean;
  timestamp: Date;
}

export interface DrillRecommendation {
  drillId: string;
  drillName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expectedImprovement: number;
  category: string;
}

// Skill calculation weights
const SKILL_WEIGHTS = {
  shooting_accuracy: 0.35,
  consistency: 0.25,
  reaction_time: 0.20,
  mental_focus: 0.15,
  endurance: 0.05
};

// Consistency thresholds
const CONSISTENCY_THRESHOLDS = {
  high: 0.85,    // 85%+ consistency
  medium: 0.70,  // 70-84% consistency
  low: 0.69      // Below 70%
};

export class SkillGraphManager {
  private static instance: SkillGraphManager;

  static getInstance(): SkillGraphManager {
    if (!SkillGraphManager.instance) {
      SkillGraphManager.instance = new SkillGraphManager();
    }
    return SkillGraphManager.instance;
  }

  /**
   * Calculate skill graph from recent range sessions
   */
  async calculateSkillGraph(uid: string): Promise<SkillGraph> {
    try {
      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sessionsRef = collection(firestore, 'range_sessions');
      const q = query(
        sessionsRef,
        where('uid', '==', uid),
        where('date', '>=', thirtyDaysAgo),
        orderBy('date', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const sessions: RangeSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          uid: data.uid,
          drillType: data.drillType,
          avgScore: data.avgScore || 0,
          totalShots: data.totalShots || 0,
          scores: data.scores || [],
          sessionDuration: data.sessionDuration || 0,
          shotDetails: data.shotDetails || [],
          date: data.date.toDate()
        });
      });

      if (sessions.length === 0) {
        return this.getDefaultSkillGraph();
      }

      // Calculate skill metrics
      const skillGraph = await this.computeSkillMetrics(sessions);
      
      // Save to Firestore
      await this.saveSkillGraph(uid, skillGraph);

      // Track analytics
      await analytics.track('skill_graph_updated', {
        userId: uid,
        sessionCount: sessions.length,
        avgAccuracy: skillGraph.shooting_accuracy,
        consistency: skillGraph.consistency,
        timestamp: new Date().toISOString()
      });

      return skillGraph;
    } catch (error) {
      console.error('Failed to calculate skill graph:', error);
      throw error;
    }
  }

  /**
   * Compute skill metrics from session data
   */
  private async computeSkillMetrics(sessions: RangeSession[]): Promise<SkillGraph> {
    const totalShots = sessions.reduce((sum, session) => sum + session.totalShots, 0);
    const totalDuration = sessions.reduce((sum, session) => sum + session.sessionDuration, 0);
    
    // Calculate shooting accuracy (weighted average of session scores)
    const weightedAccuracy = sessions.reduce((sum, session) => {
      return sum + (session.avgScore * session.totalShots);
    }, 0) / totalShots;

    // Calculate consistency (standard deviation of scores)
    const allScores = sessions.flatMap(session => session.scores);
    const consistency = this.calculateConsistency(allScores);

    // Calculate reaction time from shot details
    const reactionTime = this.calculateReactionTime(sessions);

    // Calculate mental focus (sustained performance over time)
    const mentalFocus = this.calculateMentalFocus(sessions);

    // Calculate endurance (performance in longer sessions)
    const endurance = this.calculateEndurance(sessions);

    // Determine weak and strong areas
    const weakAreas = this.identifyWeakAreas({
      shooting_accuracy: weightedAccuracy,
      consistency,
      reaction_time: reactionTime,
      mental_focus: mentalFocus,
      endurance
    });

    const strongAreas = this.identifyStrongAreas({
      shooting_accuracy: weightedAccuracy,
      consistency,
      reaction_time: reactionTime,
      mental_focus: mentalFocus,
      endurance
    });

    // Calculate improvement rate
    const improvementRate = this.calculateImprovementRate(sessions);

    return {
      shooting_accuracy: Math.round(weightedAccuracy),
      footwork_agility: 71, // Placeholder - would need motion data
      vertical_jump: 23,    // Placeholder - would need jump data
      consistency,
      reaction_time: Math.round(reactionTime),
      endurance: Math.round(endurance),
      mental_focus: Math.round(mentalFocus),
      lastUpdated: new Date(),
      sessionCount: sessions.length,
      improvementRate: Math.round(improvementRate * 100) / 100,
      weakAreas,
      strongAreas
    };
  }

  /**
   * Calculate consistency based on score variance
   */
  private calculateConsistency(scores: number[]): 'low' | 'medium' | 'high' {
    if (scores.length < 3) return 'medium';

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    if (coefficientOfVariation <= CONSISTENCY_THRESHOLDS.high) return 'high';
    if (coefficientOfVariation <= CONSISTENCY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate average reaction time from shot details
   */
  private calculateReactionTime(sessions: RangeSession[]): number {
    const reactionTimes: number[] = [];

    sessions.forEach(session => {
      if (session.shotDetails && session.shotDetails.length > 1) {
        for (let i = 1; i < session.shotDetails.length; i++) {
          const timeDiff = session.shotDetails[i].timestamp.getTime() - 
                          session.shotDetails[i-1].timestamp.getTime();
          if (timeDiff > 0 && timeDiff < 10000) { // Reasonable range: 0-10 seconds
            reactionTimes.push(timeDiff);
          }
        }
      }
    });

    if (reactionTimes.length === 0) return 2000; // Default 2 seconds

    const avgReactionTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    return Math.min(avgReactionTime, 5000); // Cap at 5 seconds
  }

  /**
   * Calculate mental focus (sustained performance)
   */
  private calculateMentalFocus(sessions: RangeSession[]): number {
    if (sessions.length < 2) return 75;

    // Calculate performance trend over time
    const recentSessions = sessions.slice(0, 5);
    const olderSessions = sessions.slice(-5);

    const recentAvg = recentSessions.reduce((sum, session) => sum + session.avgScore, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, session) => sum + session.avgScore, 0) / olderSessions.length;

    const improvement = recentAvg - olderAvg;
    
    // Base score on improvement and consistency
    let focusScore = 75;
    if (improvement > 5) focusScore += 15;
    else if (improvement > 0) focusScore += 10;
    else if (improvement < -5) focusScore -= 10;

    return Math.max(0, Math.min(100, focusScore));
  }

  /**
   * Calculate endurance (performance in longer sessions)
   */
  private calculateEndurance(sessions: RangeSession[]): number {
    const longSessions = sessions.filter(session => session.sessionDuration > 300000); // > 5 minutes
    
    if (longSessions.length === 0) return 70;

    const enduranceScores = longSessions.map(session => {
      const durationMinutes = session.sessionDuration / 60000;
      const scoreDecay = Math.max(0, (durationMinutes - 5) * 2); // 2 points per minute after 5 min
      return Math.max(0, session.avgScore - scoreDecay);
    });

    const avgEndurance = enduranceScores.reduce((sum, score) => sum + score, 0) / enduranceScores.length;
    return Math.round(avgEndurance);
  }

  /**
   * Identify weak areas for improvement
   */
  private identifyWeakAreas(skills: Partial<SkillGraph>): string[] {
    const weakAreas: string[] = [];
    const thresholds = {
      shooting_accuracy: 80,
      consistency: 'medium',
      reaction_time: 3000,
      mental_focus: 70,
      endurance: 70
    };

    if (skills.shooting_accuracy && skills.shooting_accuracy < thresholds.shooting_accuracy) {
      weakAreas.push('shooting_accuracy');
    }
    if (skills.consistency && skills.consistency === 'low') {
      weakAreas.push('consistency');
    }
    if (skills.reaction_time && skills.reaction_time > thresholds.reaction_time) {
      weakAreas.push('reaction_time');
    }
    if (skills.mental_focus && skills.mental_focus < thresholds.mental_focus) {
      weakAreas.push('mental_focus');
    }
    if (skills.endurance && skills.endurance < thresholds.endurance) {
      weakAreas.push('endurance');
    }

    return weakAreas;
  }

  /**
   * Identify strong areas
   */
  private identifyStrongAreas(skills: Partial<SkillGraph>): string[] {
    const strongAreas: string[] = [];
    const thresholds = {
      shooting_accuracy: 90,
      consistency: 'high',
      reaction_time: 1500,
      mental_focus: 85,
      endurance: 85
    };

    if (skills.shooting_accuracy && skills.shooting_accuracy >= thresholds.shooting_accuracy) {
      strongAreas.push('shooting_accuracy');
    }
    if (skills.consistency && skills.consistency === 'high') {
      strongAreas.push('consistency');
    }
    if (skills.reaction_time && skills.reaction_time <= thresholds.reaction_time) {
      strongAreas.push('reaction_time');
    }
    if (skills.mental_focus && skills.mental_focus >= thresholds.mental_focus) {
      strongAreas.push('mental_focus');
    }
    if (skills.endurance && skills.endurance >= thresholds.endurance) {
      strongAreas.push('endurance');
    }

    return strongAreas;
  }

  /**
   * Calculate improvement rate over time
   */
  private calculateImprovementRate(sessions: RangeSession[]): number {
    if (sessions.length < 4) return 0;

    const recentSessions = sessions.slice(0, Math.floor(sessions.length / 2));
    const olderSessions = sessions.slice(Math.floor(sessions.length / 2));

    const recentAvg = recentSessions.reduce((sum, session) => sum + session.avgScore, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, session) => sum + session.avgScore, 0) / olderSessions.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  /**
   * Get drill recommendations based on weak areas
   */
  async getDrillRecommendations(uid: string): Promise<DrillRecommendation[]> {
    const skillGraph = await this.getSkillGraph(uid);
    const recommendations: DrillRecommendation[] = [];

    skillGraph.weakAreas.forEach(weakArea => {
      const drillRecs = this.getDrillsForWeakArea(weakArea);
      recommendations.push(...drillRecs);
    });

    // Sort by priority and expected improvement
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             b.expectedImprovement - a.expectedImprovement;
    });
  }

  /**
   * Get specific drills for weak areas
   */
  private getDrillsForWeakArea(weakArea: string): DrillRecommendation[] {
    const drillMap: { [key: string]: DrillRecommendation[] } = {
      shooting_accuracy: [
        {
          drillId: 'precision_drill',
          drillName: '5x5 Precision Drill',
          reason: 'Focus on accuracy over speed',
          priority: 'high',
          expectedImprovement: 8,
          category: 'precision'
        },
        {
          drillId: 'slow_fire',
          drillName: 'Slow Fire Practice',
          reason: 'Build fundamental accuracy',
          priority: 'medium',
          expectedImprovement: 5,
          category: 'fundamentals'
        }
      ],
      consistency: [
        {
          drillId: 'controlled_pair',
          drillName: 'Controlled Pair',
          reason: 'Practice consistent shot timing',
          priority: 'high',
          expectedImprovement: 6,
          category: 'timing'
        },
        {
          drillId: 'metronome_drill',
          drillName: 'Metronome Drill',
          reason: 'Build rhythmic consistency',
          priority: 'medium',
          expectedImprovement: 4,
          category: 'rhythm'
        }
      ],
      reaction_time: [
        {
          drillId: 'draw_fire',
          drillName: 'Draw & Fire 1',
          reason: 'Improve draw speed and reaction',
          priority: 'high',
          expectedImprovement: 7,
          category: 'speed'
        },
        {
          drillId: 'reaction_drill',
          drillName: 'Reaction Time Drill',
          reason: 'Practice quick target acquisition',
          priority: 'medium',
          expectedImprovement: 5,
          category: 'reaction'
        }
      ],
      mental_focus: [
        {
          drillId: 'endurance_drill',
          drillName: 'Endurance Drill',
          reason: 'Build sustained concentration',
          priority: 'medium',
          expectedImprovement: 6,
          category: 'endurance'
        }
      ],
      endurance: [
        {
          drillId: 'long_session',
          drillName: 'Extended Practice Session',
          reason: 'Build physical and mental endurance',
          priority: 'medium',
          expectedImprovement: 4,
          category: 'endurance'
        }
      ]
    };

    return drillMap[weakArea] || [];
  }

  /**
   * Save skill graph to Firestore
   */
  private async saveSkillGraph(uid: string, skillGraph: SkillGraph): Promise<void> {
    const skillGraphRef = doc(firestore, 'users', uid, 'skillGraph.json');
    await setDoc(skillGraphRef, skillGraph);
  }

  /**
   * Get skill graph from Firestore
   */
  async getSkillGraph(uid: string): Promise<SkillGraph> {
    try {
      const skillGraphRef = doc(firestore, 'users', uid, 'skillGraph.json');
      const skillGraphDoc = await getDoc(skillGraphRef);
      
      if (skillGraphDoc.exists()) {
        const data = skillGraphDoc.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        } as SkillGraph;
      }
      
      return this.getDefaultSkillGraph();
    } catch (error) {
      console.error('Failed to get skill graph:', error);
      return this.getDefaultSkillGraph();
    }
  }

  /**
   * Get default skill graph for new users
   */
  private getDefaultSkillGraph(): SkillGraph {
    return {
      shooting_accuracy: 75,
      footwork_agility: 70,
      vertical_jump: 20,
      consistency: 'medium',
      reaction_time: 2500,
      endurance: 70,
      mental_focus: 75,
      lastUpdated: new Date(),
      sessionCount: 0,
      improvementRate: 0,
      weakAreas: ['shooting_accuracy', 'consistency'],
      strongAreas: []
    };
  }
}

// Export singleton instance
export const skillGraphManager = SkillGraphManager.getInstance(); 
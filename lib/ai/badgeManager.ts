import { firestore } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { analytics } from './shared/analytics';

export interface Badge {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  title: string;
  description: string;
  unlockedAt: Date;
  requirements: BadgeRequirements;
  benefits: BadgeBenefits;
}

export interface BadgeRequirements {
  minSessions: number;
  minAvgScore: number;
  minConsistency: 'low' | 'medium' | 'high';
  minReactionTime: number;
  minEndurance: number;
  specialAchievements?: string[];
}

export interface BadgeBenefits {
  monetizationEnabled: boolean;
  premiumFeatures: string[];
  communityAccess: string[];
  exclusiveContent: string[];
  prioritySupport: boolean;
}

export interface UserActivity {
  uid: string;
  totalSessions: number;
  avgScore: number;
  consistency: 'low' | 'medium' | 'high';
  reactionTime: number;
  endurance: number;
  lastSessionDate: Date;
  achievements: string[];
  currentBadge: Badge;
}

// Badge definitions
const BADGE_DEFINITIONS: { [key: string]: Badge } = {
  Bronze: {
    level: 'Bronze',
    title: 'Bronze Shooter',
    description: 'Getting started with precision shooting',
    unlockedAt: new Date(),
    requirements: {
      minSessions: 0,
      minAvgScore: 0,
      minConsistency: 'low',
      minReactionTime: 5000,
      minEndurance: 50
    },
    benefits: {
      monetizationEnabled: false,
      premiumFeatures: [],
      communityAccess: ['basic_forum'],
      exclusiveContent: [],
      prioritySupport: false
    }
  },
  Silver: {
    level: 'Silver',
    title: 'Silver Marksman',
    description: 'Demonstrating consistent improvement',
    unlockedAt: new Date(),
    requirements: {
      minSessions: 10,
      minAvgScore: 75,
      minConsistency: 'medium',
      minReactionTime: 3500,
      minEndurance: 65
    },
    benefits: {
      monetizationEnabled: true,
      premiumFeatures: ['custom_drills', 'advanced_analytics'],
      communityAccess: ['basic_forum', 'training_groups'],
      exclusiveContent: ['silver_training_plans'],
      prioritySupport: false
    }
  },
  Gold: {
    level: 'Gold',
    title: 'Gold Expert',
    description: 'Mastering precision and consistency',
    unlockedAt: new Date(),
    requirements: {
      minSessions: 25,
      minAvgScore: 85,
      minConsistency: 'high',
      minReactionTime: 2500,
      minEndurance: 80
    },
    benefits: {
      monetizationEnabled: true,
      premiumFeatures: ['custom_drills', 'advanced_analytics', 'ai_coaching'],
      communityAccess: ['basic_forum', 'training_groups', 'expert_network'],
      exclusiveContent: ['gold_training_plans', 'expert_workshops'],
      prioritySupport: true
    }
  },
  Platinum: {
    level: 'Platinum',
    title: 'Platinum Master',
    description: 'Elite level performance and leadership',
    unlockedAt: new Date(),
    requirements: {
      minSessions: 50,
      minAvgScore: 92,
      minConsistency: 'high',
      minReactionTime: 2000,
      minEndurance: 90,
      specialAchievements: ['perfect_session', 'consistency_streak']
    },
    benefits: {
      monetizationEnabled: true,
      premiumFeatures: ['custom_drills', 'advanced_analytics', 'ai_coaching', 'mentorship'],
      communityAccess: ['basic_forum', 'training_groups', 'expert_network', 'master_class'],
      exclusiveContent: ['platinum_training_plans', 'expert_workshops', 'private_lessons'],
      prioritySupport: true
    }
  },
  Diamond: {
    level: 'Diamond',
    title: 'Diamond Elite',
    description: 'Legendary status in the shooting community',
    unlockedAt: new Date(),
    requirements: {
      minSessions: 100,
      minAvgScore: 95,
      minConsistency: 'high',
      minReactionTime: 1500,
      minEndurance: 95,
      specialAchievements: ['perfect_session', 'consistency_streak', 'competition_winner']
    },
    benefits: {
      monetizationEnabled: true,
      premiumFeatures: ['custom_drills', 'advanced_analytics', 'ai_coaching', 'mentorship', 'brand_partnerships'],
      communityAccess: ['basic_forum', 'training_groups', 'expert_network', 'master_class', 'elite_circle'],
      exclusiveContent: ['diamond_training_plans', 'expert_workshops', 'private_lessons', 'brand_deals'],
      prioritySupport: true
    }
  }
};

export class BadgeManager {
  private static instance: BadgeManager;

  static getInstance(): BadgeManager {
    if (!BadgeManager.instance) {
      BadgeManager.instance = new BadgeManager();
    }
    return BadgeManager.instance;
  }

  /**
   * Weekly badge review process
   */
  async reviewAllUserBadges(): Promise<void> {
    try {
      console.log('Starting weekly badge review...');
      
      // Get all users with recent activity
      const usersRef = collection(firestore, 'users');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        usersRef,
        where('lastSessionDate', '>=', thirtyDaysAgo),
        limit(1000) // Process in batches
      );

      const querySnapshot = await getDocs(q);
      const updatedUsers: string[] = [];

      for (const userDoc of querySnapshot.docs) {
        const uid = userDoc.id;
        const wasUpgraded = await this.reviewUserBadge(uid);
        if (wasUpgraded) {
          updatedUsers.push(uid);
        }
      }

      console.log(`Badge review completed. ${updatedUsers.length} users upgraded.`);

      // Track analytics
      await analytics.track('weekly_badge_review_completed', {
        totalUsersReviewed: querySnapshot.size,
        usersUpgraded: updatedUsers.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to review user badges:', error);
      throw error;
    }
  }

  /**
   * Review individual user badge
   */
  async reviewUserBadge(uid: string): Promise<boolean> {
    try {
      const userActivity = await this.getUserActivity(uid);
      const currentBadge = userActivity.currentBadge;
      const eligibleBadge = this.calculateEligibleBadge(userActivity);

      if (eligibleBadge.level !== currentBadge.level) {
        await this.upgradeUserBadge(uid, eligibleBadge, userActivity);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to review badge for user ${uid}:`, error);
      return false;
    }
  }

  /**
   * Get user activity data
   */
  private async getUserActivity(uid: string): Promise<UserActivity> {
    // Get user's skill graph
    const skillGraphRef = doc(firestore, 'users', uid, 'skillGraph.json');
    const skillGraphDoc = await getDoc(skillGraphRef);
    
    let skillGraph;
    if (skillGraphDoc.exists()) {
      skillGraph = skillGraphDoc.data();
    } else {
      skillGraph = {
        sessionCount: 0,
        avgScore: 0,
        consistency: 'low',
        reactionTime: 5000,
        endurance: 50
      };
    }

    // Get current badge
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    const currentBadge = userData.currentBadge || BADGE_DEFINITIONS.Bronze;

    // Get achievements
    const achievements = await this.getUserAchievements(uid);

    return {
      uid,
      totalSessions: skillGraph.sessionCount || 0,
      avgScore: skillGraph.shooting_accuracy || 0,
      consistency: skillGraph.consistency || 'low',
      reactionTime: skillGraph.reaction_time || 5000,
      endurance: skillGraph.endurance || 50,
      lastSessionDate: skillGraph.lastUpdated?.toDate() || new Date(),
      achievements,
      currentBadge
    };
  }

  /**
   * Calculate eligible badge based on user activity
   */
  private calculateEligibleBadge(userActivity: UserActivity): Badge {
    const badgeLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    
    for (let i = badgeLevels.length - 1; i >= 0; i--) {
      const level = badgeLevels[i];
      const badge = BADGE_DEFINITIONS[level];
      
      if (this.meetsBadgeRequirements(userActivity, badge.requirements)) {
        return badge;
      }
    }
    
    return BADGE_DEFINITIONS.Bronze;
  }

  /**
   * Check if user meets badge requirements
   */
  private meetsBadgeRequirements(userActivity: UserActivity, requirements: BadgeRequirements): boolean {
    // Check basic requirements
    if (userActivity.totalSessions < requirements.minSessions) return false;
    if (userActivity.avgScore < requirements.minAvgScore) return false;
    if (userActivity.reactionTime > requirements.minReactionTime) return false;
    if (userActivity.endurance < requirements.minEndurance) return false;

    // Check consistency requirement
    const consistencyOrder = { low: 1, medium: 2, high: 3 };
    const userConsistency = consistencyOrder[userActivity.consistency];
    const requiredConsistency = consistencyOrder[requirements.minConsistency];
    if (userConsistency < requiredConsistency) return false;

    // Check special achievements
    if (requirements.specialAchievements) {
      for (const achievement of requirements.specialAchievements) {
        if (!userActivity.achievements.includes(achievement)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Upgrade user badge
   */
  private async upgradeUserBadge(uid: string, newBadge: Badge, userActivity: UserActivity): Promise<void> {
    try {
      // Update user document
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, {
        currentBadge: {
          ...newBadge,
          unlockedAt: new Date()
        },
        badgeUpgradedAt: new Date(),
        monetizationEnabled: newBadge.benefits.monetizationEnabled
      });

      // Send congratulatory notification
      await this.sendBadgeNotification(uid, newBadge);

      // Track analytics
      await analytics.track('badge_upgraded', {
        userId: uid,
        oldBadge: userActivity.currentBadge.level,
        newBadge: newBadge.level,
        totalSessions: userActivity.totalSessions,
        avgScore: userActivity.avgScore,
        timestamp: new Date().toISOString()
      });

      console.log(`User ${uid} upgraded from ${userActivity.currentBadge.level} to ${newBadge.level}`);

    } catch (error) {
      console.error(`Failed to upgrade badge for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Send congratulatory notification
   */
  private async sendBadgeNotification(uid: string, badge: Badge): Promise<void> {
    try {
      const notificationData = {
        uid,
        type: 'badge_upgrade',
        title: `🎉 ${badge.title} Unlocked!`,
        message: `Congratulations! You've earned the ${badge.title} badge. ${badge.description}`,
        data: {
          badgeLevel: badge.level,
          benefits: badge.benefits
        },
        createdAt: new Date(),
        read: false
      };

      const notificationsRef = collection(firestore, 'notifications');
      await addDoc(notificationsRef, notificationData);

    } catch (error) {
      console.error('Failed to send badge notification:', error);
    }
  }

  /**
   * Get user achievements
   */
  private async getUserAchievements(uid: string): Promise<string[]> {
    try {
      const achievementsRef = collection(firestore, 'users', uid, 'achievements');
      const querySnapshot = await getDocs(achievementsRef);
      
      const achievements: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.unlocked) {
          achievements.push(data.achievementId);
        }
      });

      return achievements;
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  /**
   * Check for special achievements
   */
  async checkSpecialAchievements(uid: string, sessionData: any): Promise<void> {
    try {
      const achievements: string[] = [];

      // Perfect session achievement
      if (sessionData.avgScore >= 100) {
        achievements.push('perfect_session');
      }

      // Consistency streak achievement
      const recentSessions = await this.getRecentSessions(uid, 5);
      if (recentSessions.length >= 5) {
        const avgScores = recentSessions.map(s => s.avgScore);
        const variance = this.calculateVariance(avgScores);
        if (variance < 5) { // Very low variance = high consistency
          achievements.push('consistency_streak');
        }
      }

      // Competition winner achievement (placeholder)
      if (sessionData.drillType === 'competition' && sessionData.avgScore >= 95) {
        achievements.push('competition_winner');
      }

      // Award achievements
      for (const achievement of achievements) {
        await this.awardAchievement(uid, achievement);
      }

    } catch (error) {
      console.error('Failed to check special achievements:', error);
    }
  }

  /**
   * Get recent sessions for achievement checking
   */
  private async getRecentSessions(uid: string, count: number): Promise<any[]> {
    try {
      const sessionsRef = collection(firestore, 'range_sessions');
      const q = query(
        sessionsRef,
        where('uid', '==', uid),
        orderBy('date', 'desc'),
        limit(count)
      );

      const querySnapshot = await getDocs(q);
      const sessions: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          avgScore: data.avgScore || 0,
          date: data.date.toDate()
        });
      });

      return sessions;
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }

  /**
   * Calculate variance of scores
   */
  private calculateVariance(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return variance;
  }

  /**
   * Award achievement to user
   */
  private async awardAchievement(uid: string, achievementId: string): Promise<void> {
    try {
      const achievementRef = doc(firestore, 'users', uid, 'achievements', achievementId);
      const achievementDoc = await getDoc(achievementRef);
      
      if (!achievementDoc.exists()) {
        await setDoc(achievementRef, {
          achievementId,
          unlocked: true,
          unlockedAt: new Date(),
          title: this.getAchievementTitle(achievementId),
          description: this.getAchievementDescription(achievementId)
        });

        // Track analytics
        await analytics.track('achievement_unlocked', {
          userId: uid,
          achievementId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to award achievement:', error);
    }
  }

  /**
   * Get achievement title
   */
  private getAchievementTitle(achievementId: string): string {
    const titles: { [key: string]: string } = {
      perfect_session: 'Perfect Session',
      consistency_streak: 'Consistency Master',
      competition_winner: 'Competition Champion'
    };
    return titles[achievementId] || achievementId;
  }

  /**
   * Get achievement description
   */
  private getAchievementDescription(achievementId: string): string {
    const descriptions: { [key: string]: string } = {
      perfect_session: 'Achieved a perfect score in a training session',
      consistency_streak: 'Maintained high consistency across multiple sessions',
      competition_winner: 'Won a shooting competition'
    };
    return descriptions[achievementId] || 'Achievement unlocked';
  }

  /**
   * Get badge benefits for user
   */
  async getBadgeBenefits(uid: string): Promise<BadgeBenefits | null> {
    try {
      const userRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentBadge = userData.currentBadge || BADGE_DEFINITIONS.Bronze;
        return currentBadge.benefits;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get badge benefits:', error);
      return null;
    }
  }
}

// Export singleton instance
export const badgeManager = BadgeManager.getInstance(); 
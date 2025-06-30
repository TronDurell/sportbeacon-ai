import { firestore } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { analytics } from '../ai/shared/analytics';

export interface Goal {
  id?: string;
  uid: string;
  type: 'drill' | 'score' | 'frequency';
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  category: 'daily' | 'weekly' | 'monthly' | 'achievement';
  xpReward: number;
  streakDays?: number;
  currentStreak?: number;
}

export interface Achievement {
  id?: string;
  uid: string;
  achievementId: string;
  title: string;
  description: string;
  category: string;
  xpEarned: number;
  unlockedAt: Date;
  icon?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  uid: string;
  totalXP: number;
  level: number;
  achievements: number;
  goalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: Date;
}

export class GoalEngine {
  private static instance: GoalEngine;

  static getInstance(): GoalEngine {
    if (!GoalEngine.instance) {
      GoalEngine.instance = new GoalEngine();
    }
    return GoalEngine.instance;
  }

  /**
   * Create a new goal
   */
  async createGoal(uid: string, goalData: Omit<Goal, 'id' | 'uid' | 'progress' | 'completed' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const goal: Omit<Goal, 'id'> = {
        uid,
        ...goalData,
        progress: 0,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const goalsRef = collection(firestore, 'users', uid, 'goals');
      const docRef = await addDoc(goalsRef, goal);

      // Track analytics
      await analytics.track('goal_created', {
        userId: uid,
        goalId: docRef.id,
        goalType: goalData.type,
        target: goalData.target,
        xpReward: goalData.xpReward,
        timestamp: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw error;
    }
  }

  /**
   * Track goal progress after drill completion
   */
  async trackGoalProgress(uid: string, sessionData: any): Promise<void> {
    try {
      // Get user's active goals
      const goals = await this.getUserGoals(uid);
      const activeGoals = goals.filter(goal => !goal.completed);

      for (const goal of activeGoals) {
        let progressIncrement = 0;

        switch (goal.type) {
          case 'drill':
            // Count drill completions
            if (sessionData.drillType) {
              progressIncrement = 1;
            }
            break;

          case 'score':
            // Track score improvements
            if (sessionData.avgScore >= goal.target) {
              progressIncrement = 1;
            } else {
              // Partial progress based on percentage of target
              progressIncrement = sessionData.avgScore / goal.target;
            }
            break;

          case 'frequency':
            // Track session frequency
            progressIncrement = 1;
            break;
        }

        if (progressIncrement > 0) {
          await this.updateGoalProgress(goal.id!, progressIncrement);
        }
      }

      // Check for achievements
      await this.checkAchievements(uid, sessionData);

    } catch (error) {
      console.error('Failed to track goal progress:', error);
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, increment: number): Promise<void> {
    try {
      const goalRef = doc(firestore, 'goals', goalId);
      const goalDoc = await getDoc(goalRef);

      if (!goalDoc.exists()) {
        throw new Error('Goal not found');
      }

      const goal = goalDoc.data() as Goal;
      const newProgress = Math.min(goal.target, goal.progress + increment);
      const isCompleted = newProgress >= goal.target && !goal.completed;

      const updates: any = {
        progress: newProgress,
        updatedAt: new Date()
      };

      if (isCompleted) {
        updates.completed = true;
        updates.completedAt = new Date();
      }

      await updateDoc(goalRef, updates);

      // If goal completed, award XP
      if (isCompleted) {
        await this.awardXP(goal.uid, goal.xpReward);
        await this.createAchievement(goal.uid, {
          achievementId: `goal_completed_${goal.type}`,
          title: `Goal Completed: ${goal.title}`,
          description: `Successfully completed your ${goal.type} goal`,
          category: 'goals',
          xpEarned: goal.xpReward,
          rarity: 'common'
        });

        // Track analytics
        await analytics.track('goal_completed', {
          userId: goal.uid,
          goalId: goal.id,
          goalType: goal.type,
          xpEarned: goal.xpReward,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to update goal progress:', error);
    }
  }

  /**
   * Get user's goals
   */
  async getUserGoals(uid: string): Promise<Goal[]> {
    try {
      const goalsRef = collection(firestore, 'users', uid, 'goals');
      const q = query(goalsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const goals: Goal[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        goals.push({
          id: doc.id,
          uid: data.uid,
          type: data.type,
          title: data.title,
          description: data.description,
          target: data.target,
          progress: data.progress,
          completed: data.completed,
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          category: data.category,
          xpReward: data.xpReward,
          streakDays: data.streakDays,
          currentStreak: data.currentStreak
        });
      });

      return goals;
    } catch (error) {
      console.error('Failed to get user goals:', error);
      return [];
    }
  }

  /**
   * Award XP to user
   */
  async awardXP(uid: string, xpAmount: number): Promise<void> {
    try {
      const userStatsRef = doc(firestore, 'users', uid, 'stats', 'userStats');
      const userStatsDoc = await getDoc(userStatsRef);

      let userStats: UserStats;
      if (userStatsDoc.exists()) {
        userStats = userStatsDoc.data() as UserStats;
        userStats.totalXP += xpAmount;
        userStats.level = this.calculateLevel(userStats.totalXP);
        userStats.lastUpdated = new Date();
      } else {
        userStats = {
          uid,
          totalXP: xpAmount,
          level: this.calculateLevel(xpAmount),
          achievements: 0,
          goalsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: new Date()
        };
      }

      await setDoc(userStatsRef, userStats);

      // Track analytics
      await analytics.track('xp_awarded', {
        userId: uid,
        xpAmount,
        totalXP: userStats.totalXP,
        level: userStats.level,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }

  /**
   * Calculate user level based on XP
   */
  private calculateLevel(totalXP: number): number {
    // Level calculation: each level requires 100 * level XP
    // Level 1: 0-99 XP, Level 2: 100-299 XP, etc.
    return Math.floor((Math.sqrt(1 + 8 * totalXP / 100) - 1) / 2) + 1;
  }

  /**
   * Create achievement
   */
  async createAchievement(uid: string, achievementData: Omit<Achievement, 'id' | 'uid' | 'unlockedAt'>): Promise<string> {
    try {
      const achievement: Omit<Achievement, 'id'> = {
        uid,
        ...achievementData,
        unlockedAt: new Date()
      };

      const achievementsRef = collection(firestore, 'users', uid, 'achievements');
      const docRef = await addDoc(achievementsRef, achievement);

      // Update user stats
      await this.updateUserStats(uid, { achievements: 1 });

      // Track analytics
      await analytics.track('achievement_unlocked', {
        userId: uid,
        achievementId: achievementData.achievementId,
        title: achievementData.title,
        xpEarned: achievementData.xpEarned,
        rarity: achievementData.rarity,
        timestamp: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create achievement:', error);
      throw error;
    }
  }

  /**
   * Check for achievements based on session data
   */
  async checkAchievements(uid: string, sessionData: any): Promise<void> {
    try {
      const userStats = await this.getUserStats(uid);
      const achievements = await this.getUserAchievements(uid);
      const existingAchievementIds = achievements.map(a => a.achievementId);

      // Define achievement checks
      const achievementChecks = [
        {
          id: 'first_session',
          condition: () => userStats.totalXP > 0 && !existingAchievementIds.includes('first_session'),
          title: 'First Steps',
          description: 'Complete your first training session',
          xpReward: 50,
          rarity: 'common' as const
        },
        {
          id: 'perfect_score',
          condition: () => sessionData.avgScore >= 100 && !existingAchievementIds.includes('perfect_score'),
          title: 'Perfect Score',
          description: 'Achieve a perfect score in any drill',
          xpReward: 200,
          rarity: 'rare' as const
        },
        {
          id: 'consistency_master',
          condition: () => {
            // Check for 5 consecutive sessions with 90+ score
            return false; // Would need session history
          },
          title: 'Consistency Master',
          description: 'Maintain high scores across 5 consecutive sessions',
          xpReward: 300,
          rarity: 'epic' as const
        },
        {
          id: 'speed_demon',
          condition: () => {
            // Check for fast completion times
            return false; // Would need timing data
          },
          title: 'Speed Demon',
          description: 'Complete drills with exceptional speed',
          xpReward: 250,
          rarity: 'rare' as const
        },
        {
          id: 'dedicated_trainee',
          condition: () => userStats.currentStreak >= 7 && !existingAchievementIds.includes('dedicated_trainee'),
          title: 'Dedicated Trainee',
          description: 'Train for 7 consecutive days',
          xpReward: 150,
          rarity: 'common' as const
        }
      ];

      // Check each achievement
      for (const check of achievementChecks) {
        if (check.condition()) {
          await this.createAchievement(uid, {
            achievementId: check.id,
            title: check.title,
            description: check.description,
            category: 'training',
            xpEarned: check.xpReward,
            rarity: check.rarity
          });
        }
      }

    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(uid: string): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(firestore, 'users', uid, 'achievements');
      const q = query(achievementsRef, orderBy('unlockedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const achievements: Achievement[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        achievements.push({
          id: doc.id,
          uid: data.uid,
          achievementId: data.achievementId,
          title: data.title,
          description: data.description,
          category: data.category,
          xpEarned: data.xpEarned,
          unlockedAt: data.unlockedAt.toDate(),
          icon: data.icon,
          rarity: data.rarity
        });
      });

      return achievements;
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(uid: string): Promise<UserStats> {
    try {
      const userStatsRef = doc(firestore, 'users', uid, 'stats', 'userStats');
      const userStatsDoc = await getDoc(userStatsRef);

      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        return {
          uid: data.uid,
          totalXP: data.totalXP,
          level: data.level,
          achievements: data.achievements,
          goalsCompleted: data.goalsCompleted,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastUpdated: data.lastUpdated.toDate()
        };
      }

      // Return default stats if none exist
      return {
        uid,
        totalXP: 0,
        level: 1,
        achievements: 0,
        goalsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        uid,
        totalXP: 0,
        level: 1,
        achievements: 0,
        goalsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Update user stats
   */
  async updateUserStats(uid: string, updates: Partial<UserStats>): Promise<void> {
    try {
      const userStatsRef = doc(firestore, 'users', uid, 'stats', 'userStats');
      const userStatsDoc = await getDoc(userStatsRef);

      let userStats: UserStats;
      if (userStatsDoc.exists()) {
        userStats = { ...userStatsDoc.data() as UserStats, ...updates };
      } else {
        userStats = {
          uid,
          totalXP: 0,
          level: 1,
          achievements: 0,
          goalsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: new Date(),
          ...updates
        };
      }

      userStats.lastUpdated = new Date();
      await setDoc(userStatsRef, userStats);

    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  /**
   * Update user streak
   */
  async updateUserStreak(uid: string): Promise<void> {
    try {
      const userStats = await this.getUserStats(uid);
      const today = new Date();
      const lastSession = userStats.lastUpdated;

      // Check if last session was yesterday
      const daysSinceLastSession = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastSession === 1) {
        // Continue streak
        const newStreak = userStats.currentStreak + 1;
        await this.updateUserStats(uid, {
          currentStreak: newStreak,
          longestStreak: Math.max(userStats.longestStreak, newStreak)
        });
      } else if (daysSinceLastSession > 1) {
        // Reset streak
        await this.updateUserStats(uid, { currentStreak: 1 });
      } else {
        // Same day, maintain streak
        await this.updateUserStats(uid, { currentStreak: Math.max(1, userStats.currentStreak) });
      }

    } catch (error) {
      console.error('Failed to update user streak:', error);
    }
  }

  /**
   * Get suggested goals for user
   */
  async getSuggestedGoals(uid: string): Promise<Omit<Goal, 'id' | 'uid' | 'progress' | 'completed' | 'createdAt' | 'updatedAt'>[]> {
    try {
      const userStats = await this.getUserStats(uid);
      const existingGoals = await this.getUserGoals(uid);
      const existingGoalTypes = existingGoals.map(g => g.type);

      const suggestions: Omit<Goal, 'id' | 'uid' | 'progress' | 'completed' | 'createdAt' | 'updatedAt'>[] = [];

      // Score-based goals
      if (!existingGoalTypes.includes('score')) {
        suggestions.push({
          type: 'score',
          title: 'Score Improvement',
          description: 'Achieve an average score of 85 or higher',
          target: 85,
          category: 'weekly',
          xpReward: 100
        });
      }

      // Frequency-based goals
      if (!existingGoalTypes.includes('frequency')) {
        suggestions.push({
          type: 'frequency',
          title: 'Regular Training',
          description: 'Complete 3 training sessions this week',
          target: 3,
          category: 'weekly',
          xpReward: 75
        });
      }

      // Drill-based goals
      if (!existingGoalTypes.includes('drill')) {
        suggestions.push({
          type: 'drill',
          title: 'Drill Mastery',
          description: 'Complete 5 different drill types',
          target: 5,
          category: 'monthly',
          xpReward: 150
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggested goals:', error);
      return [];
    }
  }
}

// Export singleton instance
export const goalEngine = GoalEngine.getInstance(); 
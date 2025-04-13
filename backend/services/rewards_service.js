const socketIO = require('socket.io');
const UserStats = require('../models/user_stats');

class RewardsService {
    constructor(io) {
        this.io = io;
        this.levelThresholds = this._initializeLevelThresholds();
        this.badgeDefinitions = this._initializeBadgeDefinitions();
        this.tierThresholds = {
            ROOKIE: 0,
            PRODIGY: 30,
            LEGEND: 60
        };
    }

    _initializeLevelThresholds() {
        // XP required for each level, following a progressive curve
        const thresholds = {};
        for (let level = 1; level <= 100; level++) {
            thresholds[level] = Math.floor(100 * Math.pow(level, 1.5));
        }
        return thresholds;
    }

    _initializeBadgeDefinitions() {
        return {
            streaks: {
                'week-warrior': { name: 'Week Warrior', description: '7 day workout streak', requirement: 7 },
                'month-master': { name: 'Month Master', description: '30 day workout streak', requirement: 30 },
                'consistency-king': { name: 'Consistency King', description: '90 day workout streak', requirement: 90 }
            },
            intensity: {
                'high-intensity': { name: 'High Intensity', description: 'Complete 10 high-intensity workouts', requirement: 10 },
                'endurance-expert': { name: 'Endurance Expert', description: 'Accumulate 1000 minutes of workout time', requirement: 1000 }
            },
            performance: {
                'skill-master': { name: 'Skill Master', description: 'Improve in 5 different skill categories', requirement: 5 },
                'perfect-form': { name: 'Perfect Form', description: 'Achieve perfect form rating in 3 drills', requirement: 3 }
            },
            milestones: {
                'century-club': { name: 'Century Club', description: 'Complete 100 workouts', requirement: 100 },
                'all-rounder': { name: 'All-Rounder', description: 'Try all drill categories', requirement: 'all' }
            }
        };
    }

    async calculateXPForWorkout(workoutData) {
        let xp = 0;
        
        // Base XP for completing a workout
        xp += 100;

        // Bonus XP for workout duration (1 XP per minute)
        xp += Math.floor(workoutData.duration);

        // Bonus XP for intensity
        const intensityMultiplier = {
            low: 1,
            medium: 1.5,
            high: 2
        };
        xp *= intensityMultiplier[workoutData.intensity] || 1;

        // Bonus XP for perfect form
        if (workoutData.formScore >= 0.95) {
            xp += 50;
        }

        // Bonus XP for completing all sets
        if (workoutData.completionRate === 1) {
            xp += 25;
        }

        return Math.floor(xp);
    }

    async processWorkoutCompletion(userId, workoutData) {
        try {
            // Get current user stats
            const userStats = await this.getUserStats(userId);
            const oldLevel = this.calculateLevel(userStats.totalXP);
            
            // Calculate XP for the workout
            const earnedXP = await this.calculateXPForWorkout(workoutData);
            
            // Update streak
            const streakUpdated = await this.updateStreak(userId);
            
            // Update total XP and check for level up
            const newTotalXP = userStats.totalXP + earnedXP;
            const newLevel = this.calculateLevel(newTotalXP);
            
            // Check for new badges
            const newBadges = await this.checkForNewBadges(userId, workoutData);
            
            // Update user stats in database
            await this.updateUserStats(userId, {
                totalXP: newTotalXP,
                currentStreak: userStats.currentStreak + (streakUpdated ? 1 : 0),
                workoutsCompleted: userStats.workoutsCompleted + 1
            });

            // Prepare rewards notification
            const rewards = {
                xp: earnedXP,
                levelUp: newLevel > oldLevel ? {
                    newLevel,
                    newTier: this.calculateTier(newLevel)
                } : null,
                newBadges,
                streakUpdated
            };

            // Emit rewards through websocket
            this.emitRewards(userId, rewards);

            return rewards;
        } catch (error) {
            console.error('Error processing workout completion:', error);
            throw error;
        }
    }

    calculateLevel(totalXP) {
        let level = 1;
        while (totalXP >= this.levelThresholds[level + 1] && level < 100) {
            level++;
        }
        return level;
    }

    calculateTier(level) {
        if (level >= this.tierThresholds.LEGEND) return 'LEGEND';
        if (level >= this.tierThresholds.PRODIGY) return 'PRODIGY';
        return 'ROOKIE';
    }

    async updateStreak(userId) {
        const userStats = await this.getUserStats(userId);
        const lastWorkout = await this.getLastWorkoutDate(userId);
        
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

        if (!lastWorkout || lastWorkout < twoDaysAgo) {
            // Streak broken
            await this.updateUserStats(userId, { currentStreak: 1 });
            return true;
        } else if (lastWorkout > oneDayAgo) {
            // Already worked out today
            return false;
        }
        // Streak continues
        return true;
    }

    async checkForNewBadges(userId, workoutData) {
        const userStats = await this.getUserStats(userId);
        const newBadges = [];

        // Check streak badges
        const streakBadges = this.badgeDefinitions.streaks;
        for (const [badgeId, badge] of Object.entries(streakBadges)) {
            if (!userStats.badges.includes(badgeId) && userStats.currentStreak >= badge.requirement) {
                newBadges.push(badgeId);
            }
        }

        // Check intensity badges
        if (workoutData.intensity === 'high') {
            const highIntensityCount = await this.getHighIntensityWorkoutCount(userId);
            if (highIntensityCount >= this.badgeDefinitions.intensity['high-intensity'].requirement) {
                newBadges.push('high-intensity');
            }
        }

        // Check performance badges
        if (workoutData.formScore >= 0.95) {
            const perfectFormCount = await this.getPerfectFormCount(userId);
            if (perfectFormCount >= this.badgeDefinitions.performance['perfect-form'].requirement) {
                newBadges.push('perfect-form');
            }
        }

        // Update user badges in database
        if (newBadges.length > 0) {
            await this.addBadgesToUser(userId, newBadges);
        }

        return newBadges;
    }

    emitRewards(userId, rewards) {
        this.io.to(userId).emit('rewards_update', {
            type: 'rewards_earned',
            data: rewards,
            timestamp: Date.now()
        });
    }

    // Database interaction methods (to be implemented based on your database choice)
    async getUserStats(userId) {
        let userStats = await UserStats.findOne({ userId });
        if (!userStats) {
            userStats = new UserStats({ userId });
            await userStats.save();
        }
        return userStats;
    }

    async updateUserStats(userId, stats) {
        const userStats = await UserStats.findOne({ userId });
        if (!userStats) {
            throw new Error('User stats not found');
        }

        Object.entries(stats).forEach(([key, value]) => {
            userStats[key] = value;
        });

        // Update level and tier based on XP
        if (stats.totalXP !== undefined) {
            const newLevel = this.calculateLevel(stats.totalXP);
            const newTier = this.calculateTier(newLevel);
            userStats.level = newLevel;
            userStats.tier = newTier;
        }

        return userStats.save();
    }

    async getLastWorkoutDate(userId) {
        const userStats = await UserStats.findOne({ userId });
        return userStats ? userStats.lastWorkout : null;
    }

    async getHighIntensityWorkoutCount(userId) {
        const userStats = await UserStats.findOne({ userId });
        return userStats ? userStats.achievements.highIntensityWorkouts : 0;
    }

    async getPerfectFormCount(userId) {
        const userStats = await UserStats.findOne({ userId });
        return userStats ? userStats.achievements.perfectFormCount : 0;
    }

    async addBadgesToUser(userId, newBadges) {
        const userStats = await UserStats.findOne({ userId });
        if (!userStats) {
            throw new Error('User stats not found');
        }

        for (const badgeId of newBadges) {
            const badgeCategory = Object.entries(this.badgeDefinitions)
                .find(([_, badges]) => badgeId in badges)?.[0];
            
            if (badgeCategory) {
                const badgeInfo = this.badgeDefinitions[badgeCategory][badgeId];
                await userStats.addBadge({
                    id: badgeId,
                    name: badgeInfo.name,
                    description: badgeInfo.description,
                    category: badgeCategory,
                    earnedAt: new Date()
                });
            }
        }
    }

    // Add new methods for leaderboards and stats
    async getLeaderboard(category = 'totalXP', limit = 10) {
        const aggregation = [
            { $sort: { [category]: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    username: { $arrayElemAt: ['$user.username', 0] },
                    [category]: 1,
                    tier: 1,
                    level: 1
                }
            }
        ];

        return UserStats.aggregate(aggregation);
    }

    async getProgressSummary(userId) {
        const userStats = await this.getUserStats(userId);
        const nextLevel = userStats.level + 1;
        const xpForNextLevel = this.levelThresholds[nextLevel];
        const xpProgress = userStats.totalXP - this.levelThresholds[userStats.level];
        const xpNeeded = xpForNextLevel - this.levelThresholds[userStats.level];

        return {
            currentLevel: userStats.level,
            currentTier: userStats.tier,
            totalXP: userStats.totalXP,
            currentStreak: userStats.currentStreak,
            longestStreak: userStats.longestStreak,
            progress: {
                current: xpProgress,
                needed: xpNeeded,
                percentage: Math.floor((xpProgress / xpNeeded) * 100)
            },
            recentAchievements: userStats.badges
                .sort((a, b) => b.earnedAt - a.earnedAt)
                .slice(0, 5),
            stats: {
                workoutsCompleted: userStats.workoutsCompleted,
                totalMinutes: userStats.achievements.totalWorkoutMinutes,
                averageFormScore: this._calculateAverageFormScore(userStats.workoutHistory)
            }
        };
    }

    _calculateAverageFormScore(workoutHistory) {
        if (!workoutHistory.length) return 0;
        const sum = workoutHistory.reduce((acc, workout) => acc + (workout.formScore || 0), 0);
        return Math.round((sum / workoutHistory.length) * 100) / 100;
    }
}

module.exports = RewardsService; 